import {
    createBoard, getValidMoves, makeMove,
    isTerminal, invertBoard,
    PLAYER_X, PLAYER_O
} from './game.js';
import { predict } from './model.js';

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

async function playOneGame(model, temperature) {
    const examples = [];
    let board = createBoard();
    let currentPlayer = PLAYER_X;

    while (true) {
        const perspectBoard = currentPlayer === PLAYER_X ? board : invertBoard(board);
        const { policy, value } = await predict(model, perspectBoard);
        const maskedPolicy = maskInvalidMoves(policy, perspectBoard);

        examples.push({
            board: [...perspectBoard],
            policy: [...maskedPolicy],
            player: currentPlayer
        });

        const move = sampleMove(maskedPolicy, temperature);
        board = makeMove(board, move, currentPlayer);

        const term = isTerminal(board);
        if (term.over) {
            const reward = term.winner === null ? 0 : (term.winner === PLAYER_X ? 1 : -1);
            return examples.map(ex => ({
                input: ex.board,
                policy: ex.policy,
                value: ex.player === PLAYER_X ? reward : -reward
            }));
        }
        currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
    }
}

async function playOneGameVsRandom(model, temperature) {
    const examples = [];
    let board = createBoard();

    while (true) {
        // Red's turn (always X)
        const { policy } = await predict(model, board);
        const maskedPolicy = maskInvalidMoves(policy, board);
        examples.push({
            board: [...board],
            policy: [...maskedPolicy]
        });
        const move = sampleMove(maskedPolicy, temperature);
        board = makeMove(board, move, PLAYER_X);

        const term = isTerminal(board);
        if (term.over) {
            const reward = term.winner === null ? 0 : (term.winner === PLAYER_X ? 1 : -1);
            return examples.map(ex => ({
                input: ex.board,
                policy: ex.policy,
                value: reward
            }));
        }

        // Random opponent's turn (O)
        const validMoves = getValidMoves(board);
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        board = makeMove(board, randomMove, PLAYER_O);

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

export async function trainLoop(model, config, callbacks) {
    const { numGames, batchSize, lr } = config;
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
    const allExamples = [];

    try {
        for (let g = 0; g < numGames; g++) {
            if (shouldStop && shouldStop()) break;

            const temperature = Math.max(0.3, 1.0 - (g / numGames) * 0.7);
            // First 40% of games vs random to build basic skills, then alternate
            const useRandomOpponent = g < numGames * 0.4 || g % 2 === 0;
            const examples = useRandomOpponent
                ? await playOneGameVsRandom(model, temperature)
                : await playOneGame(model, temperature);
            allExamples.push(...examples);
            totalGames++;

            if (onGameComplete) {
                onGameComplete({
                    gamesPlayed: totalGames,
                    totalGames: numGames
                });
            }

            // Train more frequently: every 10 games or when buffer is full
            if (allExamples.length >= batchSize || (totalGames % 10 === 0 && allExamples.length > 0)) {
                const batchSizeActual = Math.min(allExamples.length, batchSize);
                const batch = allExamples.splice(0, batchSizeActual);
                try {
                    const { policyLoss, valueLoss, skipped } = await trainOnBatch(model, batch, optimizer);
                    if (onTrainStep) {
                        onTrainStep({ policyLoss, valueLoss, skipped });
                    }
                } catch (trainErr) {
                    console.error('trainOnBatch error:', trainErr);
                    if (onTrainStep) {
                        onTrainStep({ policyLoss: NaN, valueLoss: NaN, error: trainErr.message });
                    }
                }
            }

            await tf.nextFrame();
        }

        if (allExamples.length > 0) {
            try {
                const { policyLoss, valueLoss, skipped } = await trainOnBatch(model, allExamples, optimizer);
                if (onTrainStep) {
                    onTrainStep({ policyLoss, valueLoss, skipped });
                }
            } catch (trainErr) {
                console.error('trainOnBatch error (final):', trainErr);
                if (onTrainStep) {
                    onTrainStep({ policyLoss: NaN, valueLoss: NaN, error: trainErr.message });
                }
            }
        }
    } finally {
        optimizer.dispose();
    }

    if (onComplete) onComplete({ totalGames });
}

async function trainOnBatch(model, batch, optimizer) {
    const inputs = batch.map(e => e.input);
    const policyTargets = batch.map(e => e.policy);
    const valueTargets = batch.map(e => [e.value]);

    const xs = tf.tensor2d(inputs);
    const policyYs = tf.tensor2d(policyTargets);
    const valueYs = tf.tensor2d(valueTargets);

    try {
        // Check for NaN in targets first
        if (hasNaN(inputs) || hasNaN(policyTargets) || hasNaN(valueTargets)) {
            console.warn('Skipping batch: NaN detected in training data');
            return { policyLoss: 0, valueLoss: 0, skipped: true };
        }

        // Compute loss for minimization
        let lossResult;
        optimizer.minimize(() => {
            return tf.tidy(() => {
                const [pPred, vPred] = model.apply(xs);
                const pLoss = tf.losses.categoricalCrossentropy(policyYs, pPred).mean();
                const vLoss = tf.losses.meanSquaredError(valueYs, vPred).mean();
                lossResult = tf.add(pLoss, vLoss);
                return lossResult;
            });
        });

        // Check if loss is finite
        const lossVal = lossResult ? lossResult.dataSync()[0] : NaN;
        if (!Number.isFinite(lossVal)) {
            console.warn('Skipping batch: non-finite loss detected:', lossVal);
            return { policyLoss: 0, valueLoss: 0, skipped: true };
        }

        // Reporting phase
        let pPred, vPred, pLoss, vLoss;
        let policyLoss = 0;
        let valueLoss = 0;
        try {
            [pPred, vPred] = model.apply(xs);
            pLoss = tf.losses.categoricalCrossentropy(policyYs, pPred).mean();
            vLoss = tf.losses.meanSquaredError(valueYs, vPred).mean();
            policyLoss = (await pLoss.data())[0];
            valueLoss = (await vLoss.data())[0];
        } finally {
            if (pPred) pPred.dispose();
            if (vPred) vPred.dispose();
            if (pLoss) pLoss.dispose();
            if (vLoss) vLoss.dispose();
        }

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

export function chooseBestMove(model, board) {
    if (!model) throw new Error('model is required');
    if (!board || !Array.isArray(board)) throw new Error('board array is required');
    return predict(model, board).then(({ policy }) => {
        const valid = getValidMoves(board);
        let bestMove = valid[0];
        let bestProb = -1;
        for (const m of valid) {
            if (policy[m] > bestProb) {
                bestProb = policy[m];
                bestMove = m;
            }
        }
        return { move: bestMove, confidence: bestProb };
    });
}
