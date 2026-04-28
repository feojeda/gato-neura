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

            const temperature = Math.max(0.1, 1.0 - (g / numGames) * 0.9);
            const examples = await playOneGame(model, temperature);
            allExamples.push(...examples);
            totalGames++;

            if (onGameComplete) {
                onGameComplete({
                    gamesPlayed: totalGames,
                    totalGames: numGames
                });
            }

            if (allExamples.length >= batchSize) {
                const batch = allExamples.splice(0, batchSize);
                const { policyLoss, valueLoss } = await trainOnBatch(model, batch, optimizer);
                if (onTrainStep) {
                    onTrainStep({ policyLoss, valueLoss });
                }
            }

            await tf.nextFrame();
        }

        if (allExamples.length > 0) {
            const { policyLoss, valueLoss } = await trainOnBatch(model, allExamples, optimizer);
            if (onTrainStep) {
                onTrainStep({ policyLoss, valueLoss });
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

    await optimizer.minimize(() => {
        const [pPred, vPred] = model.apply(xs);
        const pLoss = tf.losses.categoricalCrossentropy(policyYs, pPred);
        const vLoss = tf.losses.meanSquaredError(valueYs, vPred);
        return tf.add(pLoss, vLoss);
    });

    // Compute losses for reporting (extra forward pass)
    const [pPred, vPred] = model.apply(xs);
    const pLoss = tf.losses.categoricalCrossentropy(policyYs, pPred);
    const vLoss = tf.losses.meanSquaredError(valueYs, vPred);
    const policyLoss = (await pLoss.data())[0];
    const valueLoss = (await vLoss.data())[0];

    pPred.dispose();
    vPred.dispose();
    pLoss.dispose();
    vLoss.dispose();
    xs.dispose();
    policyYs.dispose();
    valueYs.dispose();

    return { policyLoss, valueLoss };
}

export function chooseBestMove(model, board) {
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
