import * as game from './game.js';
import * as model from './model.js';
import * as trainer from './trainer.js';
import { ReplayBuffer } from './trainer.js';
import * as viz from './visualizer.js';
import * as ui from './ui.js';
import { WIN_LINES } from './game.js';
import * as i18n from './i18n.js';
import en from './translations/en.js';
import es from './translations/es.js';
import zh from './translations/zh.js';
import ja from './translations/ja.js';

i18n.register('en', en);
i18n.register('es', es);
i18n.register('zh', zh);
i18n.register('ja', ja);

const state = {
    board: game.createBoard(),
    model: null,
    replayBuffer: null,
    totalTrainedGames: 0,
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    isTraining: false,
    shouldStop: false,
    isPlayerTurn: true,
    isWaitingForNetwork: false,
    gameOver: false,
    networkIsX: false,
    scores: { player: 0, draw: 0, network: 0 }
};

function init() {
    i18n.init();
    state.model = model.createModel();
    setupUI();
    ui.showBackendIndicator();
    refreshVisualization();
    buildInfoModal();

    // Expose for integration tests
    if (typeof window !== 'undefined') {
        window.__getNetworkMove = async (board) => {
            const temp = ui.getInferenceTemperature();
            const { move } = await trainer.chooseBestMove(state.model, board, temp);
            return move;
        };
    }
}

function setupUI() {
    ui.initLayersConfig([64, 32]);
    ui.initAddLayerButton(refreshVisualization);
    ui.initRemoveLayerButtons(refreshVisualization);
    ui.initGamesSlider();
    ui.initMctsSlider();
    ui.initInferenceTempSlider();
    ui.initMetricInfoButtons();
    ui.initBoard(handleCellClick);

    document.getElementById('btn-train').addEventListener('click', startTraining);
    document.getElementById('btn-stop-train').addEventListener('click', stopTraining);
    document.getElementById('btn-new-game').addEventListener('click', newGame);
    document.getElementById('btn-reset').addEventListener('click', resetAll);
    document.getElementById('btn-reset-model').addEventListener('click', resetModel);

    // Language selector
    const langSelect = document.getElementById('lang-select');
    if (langSelect) {
        langSelect.value = i18n.getLocale();
        langSelect.addEventListener('change', (e) => {
            i18n.setLocale(e.target.value);
            i18n.bindDOM();
            buildInfoModal();
            // Re-render any dynamic text that might be visible
            ui.renderBoard(state.board);
            if (!state.isWaitingForNetwork && !state.gameOver) {
                ui.setTurnIndicator(getTurnLabel(state.isPlayerTurn));
            }
            ui.updateScoreboard(state.scores);
            ui.updateParameterCount(model.getParameterCount(ui.getLayersConfig()));
            ui.showBackendIndicator();
        });
    }

    // Info modal
    const modal = document.getElementById('info-modal');
    const btnInfo = document.getElementById('btn-info');
    const btnClose = modal?.querySelector('.modal-close');
    if (btnInfo && modal) {
        btnInfo.addEventListener('click', () => modal.classList.remove('hidden'));
    }
    if (btnClose && modal) {
        btnClose.addEventListener('click', () => modal.classList.add('hidden'));
    }
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

    const startingSelect = document.getElementById('starting-player');
    if (startingSelect) {
        startingSelect.addEventListener('change', () => {
            if (!state.isTraining && !state.isWaitingForNetwork) {
                newGame();
            }
        });
    }

    ui.renderBoard(state.board);
}

function buildInfoModal() {
    const body = document.getElementById('info-modal-body');
    if (!body) return;
    body.innerHTML = `
        <h3>${i18n.t('info.whatIsMcts')}</h3>
        <p>${i18n.t('info.mctsDesc')}</p>

        <h3>${i18n.t('info.phasesTitle')}</h3>
        <ol>
            <li>${i18n.t('info.phase1')}</li>
            <li>${i18n.t('info.phase2')}</li>
            <li>${i18n.t('info.phase3')}</li>
        </ol>

        <h3>${i18n.t('info.metricsTitle')}</h3>
        <ul>
            <li>${i18n.t('info.metricsWinRate')}</li>
            <li>${i18n.t('info.metricsPolicyLoss')}</li>
            <li>${i18n.t('info.metricsValueLoss')}</li>
            <li>${i18n.t('info.metricsQuality')}</li>
        </ul>

        <h3>${i18n.t('info.heatmapTitle')}</h3>
        <p>${i18n.t('info.heatmapDesc')}</p>

        <h3>${i18n.t('info.tempTitle')}</h3>
        <p>${i18n.t('info.tempDesc')}</p>

        <h3>${i18n.t('info.gpuTitle')}</h3>
        <p>${i18n.t('info.gpuDesc1')}</p>
        <ul>
            <li>${i18n.t('info.gpuItem1')}</li>
            <li>${i18n.t('info.gpuItem2')}</li>
        </ul>
        <p>${i18n.t('info.gpuDesc2')}</p>

        <h3>${i18n.t('info.whyLosesTitle')}</h3>
        <p>${i18n.t('info.whyLosesDesc')}</p>
    `;
}

function refreshVisualization() {
    if (state.isWaitingForNetwork) return;
    const layers = ui.getLayersConfig();
    model.disposeModel(state.model);
    state.model = model.createModel(layers);
    state.replayBuffer = null;
    state.totalTrainedGames = 0;
    state.totalWins = 0;
    state.totalLosses = 0;
    state.totalDraws = 0;
    ui.updateParameterCount(model.getParameterCount(layers));
    viz.updateVisualization(
        document.getElementById('model-viz'),
        document.getElementById('heatmap-container'),
        state.model
    );
}

function getHumanPlayer() {
    return state.networkIsX ? game.PLAYER_O : game.PLAYER_X;
}

function getNetworkPlayer() {
    return state.networkIsX ? game.PLAYER_X : game.PLAYER_O;
}

function getTurnLabel(forHuman) {
    if (forHuman) {
        return state.networkIsX ? i18n.t('board.yourTurnO') : i18n.t('board.yourTurnX');
    }
    return i18n.t('board.thinking');
}

async function handleCellClick(pos) {
    if (!state.isPlayerTurn || state.gameOver || state.isTraining) return;
    if (state.board[pos] !== game.EMPTY) return;

    const humanPlayer = getHumanPlayer();
    const next = game.makeMove(state.board, pos, humanPlayer);
    if (!next) return;

    state.board = next;
    state.isPlayerTurn = false;
    state.isWaitingForNetwork = true;
    ui.renderBoard(state.board);
    ui.setStartingPlayerEditable(false);

    const term = game.isTerminal(state.board);
    if (term.over) {
        endGame(term);
        state.isWaitingForNetwork = false;
        return;
    }

    await makeNetworkMove();
}

async function startNewGame() {
    if (state.isTraining) return;
    state.networkIsX = ui.getNetworkStarts();
    state.board = game.createBoard();
    state.gameOver = false;
    state.isWaitingForNetwork = false;
    ui.renderBoard(state.board);
    ui.setConfidence(null);
    ui.setStartingPlayerEditable(true);

    if (state.networkIsX) {
        state.isPlayerTurn = false;
        ui.setTurnIndicator(i18n.t('board.thinking'));
        ui.setStartingPlayerEditable(false);
        await makeNetworkMove();
    } else {
        state.isPlayerTurn = true;
        ui.setTurnIndicator(i18n.t('board.yourTurnX'));
    }
}

function showPolicyHeatmap(policy) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
        const old = cell.querySelector('.policy-hint');
        if (old) old.remove();

        if (state.board[i] !== game.EMPTY) return;
        const pct = (policy[i] * 100).toFixed(0);
        const hint = document.createElement('span');
        hint.className = 'policy-hint';
        hint.textContent = pct + '%';
        cell.appendChild(hint);
    });
}

function clearPolicyHeatmap() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        const old = cell.querySelector('.policy-hint');
        if (old) old.remove();
    });
}

async function makeNetworkMove() {
    if (state.gameOver || state.isTraining) return;
    state.isWaitingForNetwork = true;

    ui.setTurnIndicator(i18n.t('board.thinking'));
    const currentModel = state.model;
    const boardForNetwork = state.networkIsX ? state.board : game.invertBoard(state.board);
    const networkPlayer = getNetworkPlayer();
    const temperature = ui.getInferenceTemperature();

    try {
        await new Promise(r => setTimeout(r, 200));
        if (!state.isWaitingForNetwork) return;
        if (state.isTraining) {
            state.isWaitingForNetwork = false;
            state.isPlayerTurn = true;
            return;
        }

        const { policy, value: rawValue } = await model.predict(currentModel, boardForNetwork);
        showPolicyHeatmap(policy);

        const { move } = await trainer.chooseBestMove(currentModel, boardForNetwork, temperature);
        if (!state.isWaitingForNetwork) return;

        ui.setConfidence(rawValue);

        state.board = game.makeMove(state.board, move, networkPlayer);
        ui.renderBoard(state.board);

        const term = game.isTerminal(state.board);
        if (term.over) {
            endGame(term);
            return;
        }

        state.isPlayerTurn = true;
        ui.setTurnIndicator(getTurnLabel(true));
    } catch (err) {
        console.error('Network move error:', err);
        state.isPlayerTurn = true;
        ui.setTurnIndicator(getTurnLabel(true));
    } finally {
        state.isWaitingForNetwork = false;
        clearPolicyHeatmap();
    }
}

function endGame(term) {
    state.gameOver = true;
    state.isPlayerTurn = true;
    const humanPlayer = getHumanPlayer();
    const networkPlayer = getNetworkPlayer();
    if (term.winner === humanPlayer) {
        state.scores.player++;
        ui.setTurnIndicator(i18n.t('board.youWon'));
    } else if (term.winner === networkPlayer) {
        state.scores.network++;
        ui.setTurnIndicator(i18n.t('board.networkWon'));
    } else {
        state.scores.draw++;
        ui.setTurnIndicator(i18n.t('board.draw'));
    }
    ui.updateScoreboard(state.scores);
    ui.setStartingPlayerEditable(true);

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
    for (const line of WIN_LINES) {
        const [a, b, c] = line;
        if (state.board[a] !== game.EMPTY &&
            state.board[a] === state.board[b] &&
            state.board[a] === state.board[c]) {
            return line;
        }
    }
    return null;
}

function newGame() {
    startNewGame().catch(err => console.error('newGame error:', err));
}

function resetModel() {
    if (state.isTraining) return;
    const layers = ui.getLayersConfig();
    model.disposeModel(state.model);
    state.model = model.createModel(layers);
    state.replayBuffer = null;
    state.totalTrainedGames = 0;
    state.totalWins = 0;
    state.totalLosses = 0;
    state.totalDraws = 0;
    ui.updateParameterCount(model.getParameterCount(layers));
    viz.updateVisualization(
        document.getElementById('model-viz'),
        document.getElementById('heatmap-container'),
        state.model
    );
    ui.setConfidence(null);
}

function resetAll() {
    if (state.isTraining) return;
    newGame();
    state.scores = { player: 0, draw: 0, network: 0 };
    ui.updateScoreboard(state.scores);
    refreshVisualization();
}

async function startTraining() {
    if (state.isWaitingForNetwork) return;
    if (state.isTraining) return;

    const config = ui.getTrainingConfig();
    const layers = ui.getLayersConfig();
    const incremental = ui.isIncrementalTraining();

    state.isTraining = true;
    state.shouldStop = false;
    ui.setTrainingUI(true);
    ui.resetMetrics();
    ui.resetLossChart();

    let needNewModel = true;
    if (incremental && state.model) {
        try {
            const info = model.getModelInfo(state.model);
            if (info.length === layers.length + 3) {
                const hiddenMatch = layers.every((n, i) => info[i + 1] === n);
                if (hiddenMatch) needNewModel = false;
            }
        } catch (e) {
            console.warn(i18n.t('errors.couldNotVerifyArch'));
        }
    }

    if (!incremental) {
        state.totalTrainedGames = 0;
        state.totalWins = 0;
        state.totalLosses = 0;
        state.totalDraws = 0;
        state.replayBuffer = new ReplayBuffer(5000);
    }

    if (needNewModel) {
        model.disposeModel(state.model);
        state.model = model.createModel(layers);
        state.totalTrainedGames = 0;
        state.totalWins = 0;
        state.totalLosses = 0;
        state.totalDraws = 0;
        state.replayBuffer = new ReplayBuffer(5000);
    }

    let lastMetrics = {};
    try {
        const result = await trainer.trainLoop(
            state.model,
            config,
            {
                onGameComplete: (data) => {
                    const cumulativeWins = state.totalWins + data.wins;
                    const cumulativeGames = state.totalTrainedGames + data.gamesPlayed;
                    const cumulativeWinRate = cumulativeGames > 0 ? cumulativeWins / cumulativeGames : 0;
                    lastMetrics = { ...lastMetrics, ...data, winRate: cumulativeWinRate };
                    const displayData = {
                        ...data,
                        winRate: cumulativeWinRate
                    };
                    ui.updateMetrics(displayData);
                    ui.updateMetricStatuses(displayData);
                    if (data.gamesPlayed % 50 === 0) {
                        viz.updateVisualization(
                            document.getElementById('model-viz'),
                            document.getElementById('heatmap-container'),
                            state.model
                        );
                    }
                },
                onTrainStep: (data) => {
                    lastMetrics = { ...lastMetrics, ...data };
                    ui.updateMetrics(data);
                    ui.updateMetricStatuses(data);
                    if (!Number.isNaN(data.policyLoss) && !Number.isNaN(data.valueLoss)) {
                        ui.addLossPoint(data.policyLoss, data.valueLoss);
                    }
                },
                onComplete: async (data) => {
                    state.isTraining = false;
                    ui.setTrainingUI(false);
                    state.totalWins += data.wins;
                    state.totalLosses += data.losses;
                    state.totalDraws += data.draws;
                    state.totalTrainedGames += data.totalGames;
                    ui.updateMetrics({ ...lastMetrics, ...data });
                    viz.updateVisualization(
                        document.getElementById('model-viz'),
                        document.getElementById('heatmap-container'),
                        state.model
                    );
                    ui.setTurnIndicator(i18n.t('controls.evaluatingQuality'));
                    const evalResult = await trainer.evaluateVsRandom(state.model, 100);
                    const qualityText = `${(evalResult.winRate * 100).toFixed(0)}% (W:${evalResult.wins} D:${evalResult.draws} L:${evalResult.losses})`;
                    ui.setModelQuality(qualityText);
                    ui.updateQualityStatus(evalResult.winRate);
                    console.log('Model quality vs random:', qualityText);
                    newGame();
                },
                shouldStop: () => state.shouldStop
            },
            state.totalTrainedGames,
            state.replayBuffer
        );

        state.totalWins += result.wins;
        state.totalLosses += result.losses;
        state.totalDraws += result.draws;
        state.totalTrainedGames += result.totalGames;
        state.replayBuffer = result.replayBuffer;
    } catch (err) {
        console.error('Training error:', err);
        state.isTraining = false;
        ui.setTrainingUI(false);
    }
}

function stopTraining() {
    state.shouldStop = true;
}

init();
