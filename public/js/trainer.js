import {
    createBoard, getValidMoves, makeMove,
    isTerminal, invertBoard, getBestMove,
    PLAYER_X, PLAYER_O
} from './game.js';
import { predict, createModel, getModelInfo } from './model.js';

/* ── Replay Buffer ─────────────────────────────────────────────── */

export class ReplayBuffer {
    constructor(capacity = 5000) {
        this.capacity = capacity;
        this.buffer = [];
    }

    push(examples) {
        this.buffer.push(...examples);
        if (this.buffer.length > this.capacity) {
            this.buffer.splice(0, this.buffer.length - this.capacity);
        }
    }

    sample(batchSize) {
        if (this.buffer.length === 0) return [];
        const batch = [];
        for (let i = 0; i < batchSize; i++) {
            const idx = Math.floor(Math.random() * this.buffer.length);
            batch.push(this.buffer[idx]);
        }
        return batch;
    }

    clear() {
        this.buffer = [];
    }

    get length() {
        return this.buffer.length;
    }
}

/* ── Helpers ───────────────────────────────────────────────────── */

function maskInvalidMoves(policy, board) {
    const masked = new Array(9).fill(0);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        if (board[i] === 0 && Number.isFinite(policy[i])) {
            masked[i] = Math.max(policy[i], 1e-8);
            sum += masked[i];
        }
    }
    if (sum > 0) {
        for (let i = 0; i < 9; i++) masked[i] /= sum;
    } else {
        const validMoves = [];
        for (let i = 0; i < 9; i++) {
            if (board[i] === 0) validMoves.push(i);
        }
        for (const m of validMoves) {
            masked[m] = 1 / validMoves.length;
        }
    }
    return masked;
}

function sampleMove(validPolicy, temperature = 1.0) {
    const moves = [];
    const probs = [];
    for (let i = 0; i < 9; i++) {
        if (validPolicy[i] > 0) {
            moves.push(i);
            probs.push(Math.pow(validPolicy[i], 1 / temperature));
        }
    }
    const sum = probs.reduce((a, b) => a + b, 0);
    const normalized = probs.map(p => p / sum);
    const r = Math.random();
    let acc = 0;
    for (let i = 0; i < moves.length; i++) {
        acc += normalized[i];
        if (r <= acc) return moves[i];
    }
    return moves[moves.length - 1];
}

/* ── Model cloning ─────────────────────────────────────────────── */

function cloneModel(original) {
    const info = getModelInfo(original);
    const hiddenLayers = info.slice(1, -2);
    const clone = createModel(hiddenLayers);
    clone.setWeights(original.getWeights().map(w => w.clone()));
    return clone;
}

/* ── Game generation ───────────────────────────────────────────── */

async function playOneGame(model, temperature, useMCTS = false, mctsSims = 50) {
    const examples = [];
    let board = createBoard();
    let currentPlayer = PLAYER_X;

    while (true) {
        const perspectBoard = currentPlayer === PLAYER_X ? board : invertBoard(board);

        let targetPolicy, rawValue;
        if (useMCTS) {
            const mctsResult = await mctsSearch(model, board, currentPlayer, mctsSims);
            targetPolicy = mctsResult.policy;
            rawValue = mctsResult.value;
        } else {
            const { policy, value } = await predict(model, perspectBoard);
            targetPolicy = maskInvalidMoves(policy, perspectBoard);
            rawValue = value;
        }

        examples.push({
            board: [...perspectBoard],
            policy: [...targetPolicy],
            player: currentPlayer,
            mctsValue: useMCTS ? rawValue : null
        });

        const move = sampleMove(targetPolicy, temperature);
        board = makeMove(board, move, currentPlayer);

        const term = isTerminal(board);
        if (term.over) {
            const reward = term.winner === null ? 0 : (term.winner === PLAYER_X ? 1 : -1);
            return examples.map(ex => ({
                input: ex.board,
                policy: ex.policy,
                value: ex.mctsValue !== null ? ex.mctsValue : (ex.player === PLAYER_X ? reward : -reward)
            }));
        }
        currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    }
}

/* ── Forced move detection (win / block) ───────────────────────── */

function findWinningMove(board, player) {
    const valid = getValidMoves(board);
    for (const m of valid) {
        const b = makeMove(board, m, player);
        const term = isTerminal(b);
        if (term.over && term.winner === player) return m;
    }
    return null;
}

function findBlockingMove(board, player) {
    const opponent = player === PLAYER_X ? PLAYER_O : PLAYER_X;
    return findWinningMove(board, opponent);
}

function buildOneHotPolicy(move) {
    const policy = new Array(9).fill(0);
    policy[move] = 1;
    return policy;
}

async function playOneGameVsRandomAsX(model, temperature, opponentModel = null, useMCTS = false, mctsSims = 50, opponentType = 'random') {
    const examples = [];
    let board = createBoard();

    while (true) {
        // Red's turn (always X)
        let targetPolicy, targetValue;
        if (useMCTS) {
            const mctsResult = await mctsSearch(model, board, PLAYER_X, mctsSims);
            targetPolicy = mctsResult.policy;
            targetValue = mctsResult.value;
        } else {
            const { policy, value } = await predict(model, board);
            targetPolicy = maskInvalidMoves(policy, board);
            targetValue = null;
        }

        // Force immediate win or block if available
        const forcedWin = findWinningMove(board, PLAYER_X);
        const forcedBlock = forcedWin !== null ? null : findBlockingMove(board, PLAYER_X);
        const finalPolicy = forcedWin !== null
            ? buildOneHotPolicy(forcedWin)
            : (forcedBlock !== null ? buildOneHotPolicy(forcedBlock) : [...targetPolicy]);

        examples.push({
            board: [...board],
            policy: finalPolicy,
            mctsValue: targetValue
        });

        const move = forcedWin !== null ? forcedWin
            : (forcedBlock !== null ? forcedBlock : sampleMove(finalPolicy, 0));
        board = makeMove(board, move, PLAYER_X);

        const term = isTerminal(board);
        if (term.over) {
            const reward = term.winner === null ? 0 : (term.winner === PLAYER_X ? 1 : -1);
            return examples.map(ex => ({
                input: ex.board,
                policy: ex.policy,
                value: ex.mctsValue !== null ? ex.mctsValue : reward
            }));
        }

        // Opponent's turn (O): random, snapshot, or minimax
        let oppMove;
        if (opponentType === 'minimax') {
            oppMove = getBestMove(board, PLAYER_O);
        } else if (opponentModel) {
            const oppBoard = invertBoard(board);
            const { move: m } = await chooseBestMove(opponentModel, oppBoard, 0.3);
            oppMove = m;
        } else {
            const validMoves = getValidMoves(board);
            oppMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        }
        board = makeMove(board, oppMove, PLAYER_O);

        const term2 = isTerminal(board);
        if (term2.over) {
            const reward = term2.winner === null ? 0 : (term2.winner === PLAYER_X ? 1 : -1);
            return examples.map(ex => ({
                input: ex.board,
                policy: ex.policy,
                value: reward
            }));
        }
    }
}

async function playOneGameVsRandomAsO(model, temperature, opponentModel = null, useMCTS = false, mctsSims = 50, opponentType = 'random') {
    const examples = [];
    let board = createBoard();

    while (true) {
        // Opponent's turn (X): random, snapshot, or minimax
        let oppMove;
        if (opponentType === 'minimax') {
            oppMove = getBestMove(board, PLAYER_X);
        } else if (opponentModel) {
            const { move: m } = await chooseBestMove(opponentModel, board, 0.3);
            oppMove = m;
        } else {
            const validMoves = getValidMoves(board);
            oppMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        }
        board = makeMove(board, oppMove, PLAYER_X);

        const term = isTerminal(board);
        if (term.over) {
            const reward = term.winner === null ? 0 : (term.winner === PLAYER_O ? 1 : -1);
            return examples.map(ex => ({
                input: ex.board,
                policy: ex.policy,
                value: reward
            }));
        }

        // Red's turn (plays as O): invert board so Red sees itself as +1
        const perspectBoard = invertBoard(board);
        let targetPolicy, targetValue;
        if (useMCTS) {
            const mctsResult = await mctsSearch(model, board, PLAYER_O, mctsSims);
            targetPolicy = mctsResult.policy;
            targetValue = mctsResult.value;
        } else {
            const { policy, value } = await predict(model, perspectBoard);
            targetPolicy = maskInvalidMoves(policy, perspectBoard);
            targetValue = null;
        }

        // Force immediate win or block if available
        const forcedWin = findWinningMove(perspectBoard, PLAYER_X);
        const forcedBlock = forcedWin !== null ? null : findBlockingMove(perspectBoard, PLAYER_X);
        const finalPolicy = forcedWin !== null
            ? buildOneHotPolicy(forcedWin)
            : (forcedBlock !== null ? buildOneHotPolicy(forcedBlock) : [...targetPolicy]);

        examples.push({
            board: [...perspectBoard],
            policy: finalPolicy,
            mctsValue: targetValue
        });

        const move = forcedWin !== null ? forcedWin
            : (forcedBlock !== null ? forcedBlock : sampleMove(finalPolicy, 0));
        board = makeMove(board, move, PLAYER_O);

        const term2 = isTerminal(board);
        if (term2.over) {
            const reward = term2.winner === null ? 0 : (term2.winner === PLAYER_O ? 1 : -1);
            return examples.map(ex => ({
                input: ex.board,
                policy: ex.policy,
                value: ex.mctsValue !== null ? ex.mctsValue : reward
            }));
        }
    }
}

/* ── Training loop ─────────────────────────────────────────────── */

export async function trainLoop(model, config, callbacks, previousGames = 0, existingReplayBuffer = null) {
    const { numGames, batchSize, lr, mctsSims = 50, useMinimax = false, minimaxRatio = 0.5 } = config;
    if (!numGames || numGames <= 0) throw new Error('config.numGames must be > 0');
    if (!batchSize || batchSize <= 0) throw new Error('config.batchSize must be > 0');
    if (!lr || lr <= 0) throw new Error('config.lr must be > 0');

    const {
        onGameComplete,
        onTrainStep,
        onComplete,
        shouldStop
    } = callbacks;

    const optimizer = tf.train.adam(lr);
    let totalGames = 0;
    let wins = 0;
    let losses = 0;
    let draws = 0;
    const replayBuffer = existingReplayBuffer || new ReplayBuffer(5000);
    let opponentModel = null;
    const snapshotInterval = 100;

    try {
        for (let g = 0; g < numGames; g++) {
            if (shouldStop && shouldStop()) break;

            const absoluteGame = g + previousGames;
            const temperature = Math.max(
                0.3,
                1.0 - (absoluteGame / (numGames + previousGames)) * 0.7
            );

            // Update opponent snapshot every 100 games after the first 100
            if (absoluteGame > 0 && absoluteGame % snapshotInterval === 0) {
                if (opponentModel) opponentModel.dispose();
                opponentModel = cloneModel(model);
                console.log(`Snapshot updated at game ${absoluteGame}`);
            }

            // Determine opponent type
            const useRandomOpponent = absoluteGame < snapshotInterval || g % 2 === 0;
            const hasSnapshot = opponentModel !== null;
            const useMCTS = mctsSims > 0 && absoluteGame >= 50; // Use MCTS after 50 games if sims > 0
            const useMinimaxNow = useMinimax && useRandomOpponent && Math.random() < minimaxRatio;
            const opponentType = useMinimaxNow ? 'minimax' : (hasSnapshot ? 'snapshot' : 'random');
            let examples;
            if (useRandomOpponent) {
                // Alternate between playing as X and as O
                const playAsX = g % 4 === 0 || g % 4 === 1;
                examples = playAsX
                    ? await playOneGameVsRandomAsX(model, temperature, hasSnapshot ? opponentModel : null, useMCTS, mctsSims, opponentType)
                    : await playOneGameVsRandomAsO(model, temperature, hasSnapshot ? opponentModel : null, useMCTS, mctsSims, opponentType);
            } else {
                examples = await playOneGame(model, temperature, useMCTS, mctsSims);
            }

            const lastValue = examples[examples.length - 1].value;
            if (lastValue > 0) wins++;
            else if (lastValue < 0) losses++;
            else draws++;
            totalGames++;

            // Add all examples to buffer (even losses, snapshot opponent is good data)
            replayBuffer.push(examples);

            if (onGameComplete) {
                onGameComplete({
                    gamesPlayed: totalGames,
                    totalGames: numGames,
                    winRate: wins / totalGames,
                    wins, losses, draws
                });
            }

            // Train after every game if we have enough samples
            if (replayBuffer.length >= batchSize) {
                const batch = replayBuffer.sample(batchSize);
                try {
                    const { policyLoss, valueLoss, skipped } = await trainOnBatch(model, batch, optimizer);
                    if (onTrainStep) onTrainStep({ policyLoss, valueLoss, skipped });
                } catch (trainErr) {
                    console.error('trainOnBatch error:', trainErr);
                    if (onTrainStep) onTrainStep({ policyLoss: NaN, valueLoss: NaN, error: trainErr.message });
                }
            }

            await tf.nextFrame();
        }

        // Final training pass with remaining buffer
        if (replayBuffer.length > 0) {
            const finalBatchSize = Math.min(replayBuffer.length, batchSize);
            const batch = replayBuffer.sample(finalBatchSize);
            try {
                const { policyLoss, valueLoss, skipped } = await trainOnBatch(model, batch, optimizer);
                if (onTrainStep) onTrainStep({ policyLoss, valueLoss, skipped });
            } catch (trainErr) {
                console.error('trainOnBatch error (final):', trainErr);
                if (onTrainStep) onTrainStep({ policyLoss: NaN, valueLoss: NaN, error: trainErr.message });
            }
        }
    } finally {
        optimizer.dispose();
        if (opponentModel) opponentModel.dispose();
    }

    if (onComplete) await onComplete({ totalGames, wins, losses, draws });

    return { totalGames, wins, losses, draws, replayBuffer };
}

/* ── Batch training ────────────────────────────────────────────── */

async function trainOnBatch(model, batch, optimizer) {
    const inputs = batch.map(e => e.input);
    const policyTargets = batch.map(e => e.policy);
    const valueTargets = batch.map(e => [e.value]);

    const xs = tf.tensor2d(inputs);
    const policyYs = tf.tensor2d(policyTargets);
    const valueYs = tf.tensor2d(valueTargets);

    try {
        if (hasNaN(inputs) || hasNaN(policyTargets) || hasNaN(valueTargets)) {
            console.warn('Skipping batch: NaN detected in training data');
            return { policyLoss: 0, valueLoss: 0, skipped: true };
        }

        // Forward + backprop via optimizer.minimize
        let lossNum = NaN;
        try {
            optimizer.minimize(() => {
                const [pPred, vPred] = model.apply(xs);
                const epsilon = 1e-7;
                const clippedPred = tf.clipByValue(pPred, epsilon, 1 - epsilon);
                const pLoss = tf.neg(tf.mean(tf.sum(tf.mul(policyYs, tf.log(clippedPred)), -1)));
                const vLoss = tf.losses.meanSquaredError(valueYs, vPred).mean();
                const totalLoss = tf.add(pLoss, vLoss);
                // Check loss value synchronously for safety
                lossNum = totalLoss.dataSync()[0];
                return totalLoss;
            }, true, model.trainableVariables);
        } catch (e) {
            console.warn('Skipping batch: minimize error:', e.message);
            return { policyLoss: NaN, valueLoss: NaN, skipped: true };
        }

        if (!Number.isFinite(lossNum)) {
            console.warn('Skipping batch: non-finite loss detected');
            return { policyLoss: NaN, valueLoss: NaN, skipped: true };
        }

        // Reporting: fresh forward pass for metrics
        let policyLoss = 0;
        let valueLoss = 0;
        const reportTensors = tf.tidy(() => {
            const [pPred, vPred] = model.apply(xs);
            const epsilon = 1e-7;
            const clippedPred = tf.clipByValue(pPred, epsilon, 1 - epsilon);
            const pLoss = tf.neg(tf.mean(tf.sum(tf.mul(policyYs, tf.log(clippedPred)), -1)));
            const vLoss = tf.losses.meanSquaredError(valueYs, vPred).mean();
            return [pLoss, vLoss];
        });

        policyLoss = (await reportTensors[0].data())[0];
        valueLoss = (await reportTensors[1].data())[0];
        reportTensors.forEach(t => t.dispose());

        return { policyLoss, valueLoss };
    } finally {
        xs.dispose();
        policyYs.dispose();
        valueYs.dispose();
    }
}

function hasNaN(arr) {
    if (!Array.isArray(arr)) return Number.isNaN(arr);
    for (let i = 0; i < arr.length; i++) {
        if (Array.isArray(arr[i])) {
            if (hasNaN(arr[i])) return true;
        } else if (Number.isNaN(arr[i])) {
            return true;
        }
    }
    return false;
}

/* ── MCTS (Monte Carlo Tree Search) ──────────────────────────── */

class MCTSNode {
    constructor(board, player, parent = null, action = null, prior = 0) {
        this.board = board;
        this.player = player; // whose turn it is at this node
        this.parent = parent;
        this.action = action; // action that led to this node from parent
        this.prior = prior;   // prior probability from policy network
        this.visitCount = 0;
        this.valueSum = 0;
        this.children = [];
        this.isExpanded = false;
    }

    get value() {
        return this.visitCount === 0 ? 0 : this.valueSum / this.visitCount;
    }

    get isLeaf() {
        return !this.isExpanded;
    }
}

function ucbScore(child, parentVisits, c_puct = 1.5) {
    const q = child.visitCount === 0 ? 0 : -child.value; // negative because we alternate players
    const u = c_puct * child.prior * Math.sqrt(parentVisits) / (1 + child.visitCount);
    return q + u;
}

function expandNode(node, policy) {
    const validMoves = getValidMoves(node.board);
    const totalPrior = validMoves.reduce((sum, m) => sum + policy[m], 0);
    for (const move of validMoves) {
        const nextBoard = makeMove(node.board, move, node.player);
        const nextPlayer = node.player === PLAYER_X ? PLAYER_O : PLAYER_X;
        const prior = totalPrior > 0 ? policy[move] / totalPrior : 1 / validMoves.length;
        node.children.push(new MCTSNode(nextBoard, nextPlayer, node, move, prior));
    }
    node.isExpanded = true;
}

async function mctsSearch(model, board, player, numSimulations = 50) {
    const root = new MCTSNode(board, player);
    
    // Initial expansion
    const perspectBoard = player === PLAYER_X ? board : invertBoard(board);
    const { policy, value } = await predict(model, perspectBoard);
    const maskedPolicy = maskInvalidMoves(policy, board);
    expandNode(root, maskedPolicy);
    
    for (let sim = 0; sim < numSimulations; sim++) {
        // Selection: traverse tree using UCB1
        let node = root;
        while (!node.isLeaf) {
            let bestChild = null;
            let bestScore = -Infinity;
            for (const child of node.children) {
                const score = ucbScore(child, node.visitCount);
                if (score > bestScore) {
                    bestScore = score;
                    bestChild = child;
                }
            }
            node = bestChild;
            
            // Check if terminal
            const term = isTerminal(node.board);
            if (term.over) {
                const reward = term.winner === null ? 0 : (term.winner === player ? 1 : -1);
                backpropagate(node, reward);
                break;
            }
        }
        
        if (!node.isExpanded) {
            // Check if terminal before expanding
            const term = isTerminal(node.board);
            if (term.over) {
                const reward = term.winner === null ? 0 : (term.winner === player ? 1 : -1);
                node.isExpanded = true; // mark as expanded so we don't re-evaluate
                backpropagate(node, reward);
                continue;
            }

            // Expansion + Evaluation
            const perspect = node.player === PLAYER_X ? node.board : invertBoard(node.board);
            const { policy: p, value: v } = await predict(model, perspect);
            const masked = maskInvalidMoves(p, node.board);
            expandNode(node, masked);
            
            // Value estimate (from network's perspective of current player)
            let reward;
            if (node.player === player) {
                reward = v;
            } else {
                reward = -v; // flip for opponent's perspective
            }
            backpropagate(node, reward);
        }
    }
    
    // Build policy target from visit counts
    const visitCounts = new Array(9).fill(0);
    for (const child of root.children) {
        visitCounts[child.action] = child.visitCount;
    }
    const totalVisits = visitCounts.reduce((a, b) => a + b, 0);
    const targetPolicy = totalVisits > 0 
        ? visitCounts.map(v => v / totalVisits)
        : maskedPolicy;
    
    return { policy: targetPolicy, value: root.value };
}

function backpropagate(node, value) {
    while (node !== null) {
        node.visitCount++;
        node.valueSum += value;
        value = -value; // flip for alternating players
        node = node.parent;
    }
}

/* ── Model evaluation vs random ──────────────────────────────── */

export async function evaluateVsRandom(model, numGames = 100) {
    let wins = 0;
    let losses = 0;
    let draws = 0;
    for (let g = 0; g < numGames; g++) {
        const playAsX = g % 2 === 0;
        let board = createBoard();
        while (true) {
            if (playAsX) {
                // Red as X (greedy)
                const { move } = await chooseBestMove(model, board, 0);
                board = makeMove(board, move, PLAYER_X);
                const term = isTerminal(board);
                if (term.over) {
                    if (term.winner === PLAYER_X) wins++;
                    else if (term.winner === PLAYER_O) losses++;
                    else draws++;
                    break;
                }
                // Random O
                const vm = getValidMoves(board);
                board = makeMove(board, vm[Math.floor(Math.random() * vm.length)], PLAYER_O);
                const term2 = isTerminal(board);
                if (term2.over) {
                    if (term2.winner === PLAYER_X) wins++;
                    else if (term2.winner === PLAYER_O) losses++;
                    else draws++;
                    break;
                }
            } else {
                // Random X
                const vm = getValidMoves(board);
                board = makeMove(board, vm[Math.floor(Math.random() * vm.length)], PLAYER_X);
                const term = isTerminal(board);
                if (term.over) {
                    if (term.winner === PLAYER_O) wins++;
                    else if (term.winner === PLAYER_X) losses++;
                    else draws++;
                    break;
                }
                // Red as O (greedy)
                const perspect = invertBoard(board);
                const { move } = await chooseBestMove(model, perspect, 0);
                board = makeMove(board, move, PLAYER_O);
                const term2 = isTerminal(board);
                if (term2.over) {
                    if (term2.winner === PLAYER_O) wins++;
                    else if (term2.winner === PLAYER_X) losses++;
                    else draws++;
                    break;
                }
            }
        }
    }
    return { wins, losses, draws, winRate: wins / numGames };
}

/* ── Inference helper ──────────────────────────────────────────── */

export function chooseBestMove(model, board, temperature = 0) {
    if (!model) throw new Error('model is required');
    if (!board || !Array.isArray(board)) throw new Error('board array is required');
    return predict(model, board).then(({ policy }) => {
        const valid = getValidMoves(board);
        if (temperature <= 0) {
            // Greedy: always pick highest probability
            let bestMove = valid[0];
            let bestProb = -1;
            for (const m of valid) {
                if (policy[m] > bestProb) {
                    bestProb = policy[m];
                    bestMove = m;
                }
            }
            return { move: bestMove, confidence: bestProb };
        }
        // Sample with temperature
        const maskedPolicy = maskInvalidMoves(policy, board);
        const move = sampleMove(maskedPolicy, temperature);
        const confidence = maskedPolicy[move];
        return { move, confidence };
    });
}
