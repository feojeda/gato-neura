import * as game from './game.js';
import * as model from './model.js';
import * as trainer from './trainer.js';
import * as viz from './visualizer.js';
import * as ui from './ui.js';

const state = {
    board: game.createBoard(),
    model: null,
    isTraining: false,
    shouldStop: false,
    isPlayerTurn: true,
    gameOver: false,
    scores: { player: 0, draw: 0, network: 0 }
};

function init() {
    state.model = model.createModel();
    setupUI();
    refreshVisualization();
}

function setupUI() {
    ui.initLayersConfig([64, 32]);
    ui.initAddLayerButton(refreshVisualization);
    ui.initRemoveLayerButtons(refreshVisualization);
    ui.initGamesSlider();
    ui.initBoard(handleCellClick);

    document.getElementById('btn-train').addEventListener('click', startTraining);
    document.getElementById('btn-stop-train').addEventListener('click', stopTraining);
    document.getElementById('btn-new-game').addEventListener('click', newGame);
    document.getElementById('btn-reset').addEventListener('click', resetAll);

    ui.renderBoard(state.board);
}

function refreshVisualization() {
    const layers = ui.getLayersConfig();
    model.disposeModel(state.model);
    state.model = model.createModel(layers);
    viz.updateVisualization(
        document.getElementById('model-viz'),
        document.getElementById('heatmap-container'),
        state.model
    );
}

async function handleCellClick(pos) {
    if (!state.isPlayerTurn || state.gameOver || state.isTraining) return;
    if (state.board[pos] !== game.EMPTY) return;

    const next = game.makeMove(state.board, pos, game.PLAYER_X);
    if (!next) return;

    state.board = next;
    ui.renderBoard(state.board);

    const term = game.isTerminal(state.board);
    if (term.over) {
        endGame(term);
        return;
    }

    state.isPlayerTurn = false;
    ui.setTurnIndicator('Pensando...');

    await new Promise(r => setTimeout(r, 200));

    const boardForNetwork = state.board;
    const { move, confidence } = await trainer.chooseBestMove(state.model, boardForNetwork);

    state.board = game.makeMove(state.board, move, game.PLAYER_O);
    ui.renderBoard(state.board);
    ui.setConfidence(confidence);

    const term2 = game.isTerminal(state.board);
    if (term2.over) {
        endGame(term2);
        return;
    }

    state.isPlayerTurn = true;
    ui.setTurnIndicator('Tu turno (X)');
}

function endGame(term) {
    state.gameOver = true;
    if (term.winner === game.PLAYER_X) {
        state.scores.player++;
        ui.setTurnIndicator('Ganaste!');
    } else if (term.winner === game.PLAYER_O) {
        state.scores.network++;
        ui.setTurnIndicator('Ganó la Red');
    } else {
        state.scores.draw++;
        ui.setTurnIndicator('Empate');
    }
    ui.updateScoreboard(state.scores);

    const winLine = getWinLine(term.winner);
    ui.renderBoard(state.board, winLine);

    if (state.model) {
        viz.updateVisualization(
            document.getElementById('model-viz'),
            document.getElementById('heatmap-container'),
            state.model
        );
    }
}

function getWinLine(winner) {
    if (winner === null) return null;
    const lines = [
        [0,1,2],[3,4,5],[6,7,8],
        [0,3,6],[1,4,7],[2,5,8],
        [0,4,8],[2,4,6]
    ];
    for (const line of lines) {
        const [a,b,c] = line;
        if (state.board[a] !== game.EMPTY &&
            state.board[a] === state.board[b] &&
            state.board[a] === state.board[c]) {
            return line;
        }
    }
    return null;
}

function newGame() {
    state.board = game.createBoard();
    state.isPlayerTurn = true;
    state.gameOver = false;
    ui.renderBoard(state.board);
    ui.setTurnIndicator('Tu turno (X)');
    ui.setConfidence(null);
}

function resetAll() {
    newGame();
    state.scores = { player: 0, draw: 0, network: 0 };
    ui.updateScoreboard(state.scores);
    refreshVisualization();
}

async function startTraining() {
    const config = ui.getTrainingConfig();
    const layers = ui.getLayersConfig();

    state.isTraining = true;
    state.shouldStop = false;
    ui.setTrainingUI(true);
    ui.resetMetrics();

    model.disposeModel(state.model);
    state.model = model.createModel(layers);

    await trainer.trainLoop(state.model, config, {
        onGameComplete: (data) => {
            ui.updateMetrics(data);
            if (data.gamesPlayed % 50 === 0) {
                viz.updateVisualization(
                    document.getElementById('model-viz'),
                    document.getElementById('heatmap-container'),
                    state.model
                );
            }
        },
        onTrainStep: (data) => {
            ui.updateMetrics(data);
        },
        onComplete: (data) => {
            state.isTraining = false;
            ui.setTrainingUI(false);
            ui.updateMetrics(data);
            viz.updateVisualization(
                document.getElementById('model-viz'),
                document.getElementById('heatmap-container'),
                state.model
            );
            newGame();
        },
        shouldStop: () => state.shouldStop
    });

    if (state.shouldStop) {
        state.isTraining = false;
        ui.setTrainingUI(false);
        viz.updateVisualization(
            document.getElementById('model-viz'),
            document.getElementById('heatmap-container'),
            state.model
        );
    }
}

function stopTraining() {
    state.shouldStop = true;
}

init();
