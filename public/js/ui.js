import * as i18n from './i18n.js';

export function initBoard(onCellClick) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.addEventListener('click', () => {
            const pos = parseInt(cell.getAttribute('data-pos'), 10);
            onCellClick(pos);
        });
    });
}

export function renderBoard(board, winLine = null) {
    const cells = document.querySelectorAll('.cell');
    cells.forEach((cell, i) => {
        cell.textContent = '';
        cell.className = 'cell';
        if (board[i] === 1) {
            cell.textContent = 'X';
            cell.classList.add('x');
        } else if (board[i] === -1) {
            cell.textContent = 'O';
            cell.classList.add('o');
        }
        if (winLine && winLine.includes(i)) {
            cell.classList.add('winner');
        }
    });
}

export function setTurnIndicator(text) {
    const el = document.getElementById('turn-indicator');
    if (el) el.textContent = text;
}

export function setConfidence(value) {
    const el = document.getElementById('confidence-display');
    if (!el) return;
    if (value === null || value === undefined) {
        el.textContent = i18n.t('model.params').replace('—', i18n.t('metric.winRate') === 'Win Rate:' ? '—' : '—');
        // Use proper translation: "Confidence: —"
        el.textContent = `${i18n.t('board.confidence')}: —`;
    } else {
        const pct = ((value + 1) / 2 * 100).toFixed(0);
        el.textContent = `${i18n.t('board.confidence')}: ${value.toFixed(2)} (${pct}%)`;
    }
}

export function updateScoreboard(scores) {
    const playerEl = document.getElementById('score-player');
    const drawEl = document.getElementById('score-draw');
    const networkEl = document.getElementById('score-network');
    if (playerEl) playerEl.textContent = scores.player;
    if (drawEl) drawEl.textContent = scores.draw;
    if (networkEl) networkEl.textContent = scores.network;
}

export function initLayersConfig(defaultLayers = [64, 32]) {
    const container = document.getElementById('layers-config');
    if (!container) return;
    container.innerHTML = '';
    defaultLayers.forEach((neurons, i) => addLayerRow(container, i, neurons));
}

function addLayerRow(container, index, neurons) {
    const row = document.createElement('div');
    row.className = 'layer-row';
    row.innerHTML = `
        <label>${i18n.t('model.layer', { n: index + 1 })}</label>
        <input type="number" min="1" max="128" value="${neurons}" data-layer="${index}">
        <button class="btn-remove-layer" data-layer="${index}">×</button>
    `;
    container.appendChild(row);
}

export function getLayersConfig() {
    const inputs = document.querySelectorAll('#layers-config input[type="number"]');
    const layers = [];
    inputs.forEach(input => {
        const val = parseInt(input.value, 10);
        layers.push(Math.max(1, Math.min(128, val)));
    });
    return layers;
}

export function setLayersConfigEditable(editable) {
    const inputs = document.querySelectorAll('#layers-config input');
    const buttons = document.querySelectorAll('#layers-config button');
    const addBtn = document.getElementById('btn-add-layer');
    inputs.forEach(i => i.disabled = !editable);
    buttons.forEach(b => b.disabled = !editable);
    if (addBtn) addBtn.disabled = !editable;
}

export function initAddLayerButton(onClick) {
    const btn = document.getElementById('btn-add-layer');
    if (!btn) return;
    btn.addEventListener('click', () => {
        const container = document.getElementById('layers-config');
        if (!container) return;
        const count = container.children.length;
        if (count >= 5) return;
        addLayerRow(container, count, 32);
        onClick();
    });
}

export function initRemoveLayerButtons(onClick) {
    const container = document.getElementById('layers-config');
    if (!container) return;
    container.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-layer')) {
            if (container.children.length <= 1) return;
            e.target.parentElement.remove();
            relabelLayers();
            onClick();
        }
    });
}

function relabelLayers() {
    const rows = document.querySelectorAll('#layers-config .layer-row');
    rows.forEach((row, i) => {
        row.querySelector('label').textContent = i18n.t('model.layer', { n: i + 1 });
    });
}

export function getTrainingConfig() {
    const numGames = parseInt(document.getElementById('input-games')?.value, 10);
    const lr = parseFloat(document.getElementById('input-lr')?.value);
    const batchSize = parseInt(document.getElementById('input-batch')?.value, 10);
    const mctsSims = parseInt(document.getElementById('input-mcts')?.value, 10);
    const useMinimax = document.getElementById('input-minimax')?.checked ?? false;
    return {
        numGames: Number.isNaN(numGames) ? 500 : Math.max(1, numGames),
        lr: Number.isNaN(lr) ? 0.001 : Math.max(1e-6, lr),
        batchSize: Number.isNaN(batchSize) ? 64 : Math.max(1, batchSize),
        mctsSims: Number.isNaN(mctsSims) ? 50 : Math.max(0, mctsSims),
        useMinimax,
        minimaxRatio: 0.5
    };
}

export function initGamesSlider() {
    const slider = document.getElementById('input-games');
    const display = document.getElementById('games-value');
    if (!slider || !display) return;
    slider.addEventListener('input', () => {
        display.textContent = slider.value;
    });
}

export function initMctsSlider() {
    const slider = document.getElementById('input-mcts');
    const display = document.getElementById('mcts-value');
    if (!slider || !display) return;
    slider.addEventListener('input', () => {
        display.textContent = slider.value;
    });
}

export function isIncrementalTraining() {
    const el = document.getElementById('input-incremental');
    return el ? el.checked : false;
}

export function getNetworkStarts() {
    const el = document.getElementById('starting-player');
    return el ? el.value === 'network' : false;
}

export function setStartingPlayerEditable(editable) {
    const el = document.getElementById('starting-player');
    if (el) el.disabled = !editable;
}

export function setTrainingUI(isTraining) {
    const trainBtn = document.getElementById('btn-train');
    const stopBtn = document.getElementById('btn-stop-train');
    const newGameBtn = document.getElementById('btn-new-game');
    const resetBtn = document.getElementById('btn-reset');
    const resetModelBtn = document.getElementById('btn-reset-model');
    const incrementalCheckbox = document.getElementById('input-incremental');
    const mctsSlider = document.getElementById('input-mcts');
    if (trainBtn) trainBtn.disabled = isTraining;
    if (stopBtn) stopBtn.disabled = !isTraining;
    if (newGameBtn) newGameBtn.disabled = isTraining;
    if (resetBtn) resetBtn.disabled = isTraining;
    if (resetModelBtn) resetModelBtn.disabled = isTraining;
    if (incrementalCheckbox) incrementalCheckbox.disabled = isTraining;
    if (mctsSlider) mctsSlider.disabled = isTraining;
    setLayersConfigEditable(!isTraining);
}

export function updateMetrics(data) {
    if (data.gamesPlayed !== undefined) {
        const gamesEl = document.getElementById('metric-games');
        const progressEl = document.getElementById('train-progress');
        if (gamesEl) gamesEl.textContent = `${data.gamesPlayed}/${data.totalGames}`;
        if (progressEl && data.totalGames > 0) {
            const pct = (data.gamesPlayed / data.totalGames * 100).toFixed(0);
            progressEl.style.width = `${pct}%`;
        }
    }
    if (data.winRate !== undefined) {
        const el = document.getElementById('metric-winrate');
        if (el) el.textContent = (data.winRate * 100).toFixed(1) + '%';
    }
    if (data.policyLoss !== undefined) {
        const el = document.getElementById('metric-ploss');
        if (el) {
            if (Number.isNaN(data.policyLoss)) {
                el.textContent = i18n.t('metric.error');
            } else if (data.skipped) {
                el.textContent = '—';
            } else {
                el.textContent = data.policyLoss.toFixed(4);
            }
        }
    }
    if (data.valueLoss !== undefined) {
        const el = document.getElementById('metric-vloss');
        if (el) {
            if (Number.isNaN(data.valueLoss)) {
                el.textContent = i18n.t('metric.error');
            } else if (data.skipped) {
                el.textContent = '—';
            } else {
                el.textContent = data.valueLoss.toFixed(4);
            }
        }
    }
    if (data.error) {
        const el = document.getElementById('metric-ploss');
        if (el) el.textContent = i18n.t('metric.error');
    }
}

export function resetMetrics() {
    const gamesEl = document.getElementById('metric-games');
    const winrateEl = document.getElementById('metric-winrate');
    const plossEl = document.getElementById('metric-ploss');
    const vlossEl = document.getElementById('metric-vloss');
    const qualityEl = document.getElementById('metric-quality');
    const progressEl = document.getElementById('train-progress');
    if (gamesEl) gamesEl.textContent = '0/0';
    if (winrateEl) winrateEl.textContent = '—';
    if (plossEl) plossEl.textContent = '—';
    if (vlossEl) vlossEl.textContent = '—';
    if (qualityEl) qualityEl.textContent = '—';
    if (progressEl) progressEl.style.width = '0%';
}

export function setModelQuality(text) {
    const el = document.getElementById('metric-quality');
    if (el) el.textContent = text;
}

/* ── Metric status helpers ─────────────────────────────────────── */

function getWinRateStatus(winRate) {
    const pct = winRate * 100;
    if (pct >= 80) return { label: i18n.t('status.excellent'), class: 'status-excellent' };
    if (pct >= 60) return { label: i18n.t('status.good'), class: 'status-good' };
    if (pct >= 40) return { label: i18n.t('status.fair'), class: 'status-meh' };
    return { label: i18n.t('status.poor'), class: 'status-bad' };
}

function getPolicyLossStatus(loss) {
    if (loss <= 1.0) return { label: i18n.t('status.excellent'), class: 'status-excellent' };
    if (loss <= 1.5) return { label: i18n.t('status.good'), class: 'status-good' };
    if (loss <= 2.0) return { label: i18n.t('status.fair'), class: 'status-meh' };
    return { label: i18n.t('status.poor'), class: 'status-bad' };
}

function getValueLossStatus(loss) {
    if (loss <= 0.3) return { label: i18n.t('status.excellent'), class: 'status-excellent' };
    if (loss <= 0.6) return { label: i18n.t('status.good'), class: 'status-good' };
    if (loss <= 1.0) return { label: i18n.t('status.fair'), class: 'status-meh' };
    return { label: i18n.t('status.poor'), class: 'status-bad' };
}

function getQualityStatus(winRate) {
    const pct = winRate * 100;
    if (pct >= 90) return { label: i18n.t('status.excellent'), class: 'status-excellent' };
    if (pct >= 70) return { label: i18n.t('status.good'), class: 'status-good' };
    if (pct >= 50) return { label: i18n.t('status.fair'), class: 'status-meh' };
    return { label: i18n.t('status.poor'), class: 'status-bad' };
}

function updateStatusIndicator(elementId, status) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = status.label;
    el.className = 'metric-status ' + status.class;
}

export function updateMetricStatuses(data) {
    if (data.winRate !== undefined) {
        updateStatusIndicator('metric-winrate-status', getWinRateStatus(data.winRate));
    }
    if (data.policyLoss !== undefined && !Number.isNaN(data.policyLoss) && !data.skipped) {
        updateStatusIndicator('metric-ploss-status', getPolicyLossStatus(data.policyLoss));
    }
    if (data.valueLoss !== undefined && !Number.isNaN(data.valueLoss) && !data.skipped) {
        updateStatusIndicator('metric-vloss-status', getValueLossStatus(data.valueLoss));
    }
}

export function updateQualityStatus(winRate) {
    updateStatusIndicator('metric-quality-status', getQualityStatus(winRate));
}

export function showBackendIndicator() {
    const el = document.getElementById('backend-indicator');
    if (!el) return;
    const backend = tf.getBackend();
    if (backend === 'webgl') {
        el.textContent = i18n.t('controls.gpuActive');
        el.className = 'backend-indicator backend-gpu';
    } else {
        el.textContent = i18n.t('controls.cpuSlow');
        el.className = 'backend-indicator backend-cpu';
    }
}

/* ── Metric detail modals ──────────────────────────────────────── */

export function initMetricInfoButtons() {
    const modal = document.getElementById('metric-modal');
    const titleEl = document.getElementById('metric-modal-title');
    const bodyEl = document.getElementById('metric-modal-body');
    const closeBtn = document.getElementById('metric-modal-close');

    if (!modal) return;

    document.querySelectorAll('.info-icon').forEach(btn => {
        btn.addEventListener('click', () => {
            const metric = btn.dataset.metric;
            const detail = i18n.raw(`modal.${metric}`);
            if (detail && titleEl && bodyEl) {
                titleEl.textContent = detail.title || i18n.t('modal.metricTitle');
                bodyEl.innerHTML = detail.body || '';
                modal.classList.remove('hidden');
            }
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.add('hidden');
    });
}

export function initInferenceTempSlider() {
    const slider = document.getElementById('input-inference-temp');
    const display = document.getElementById('inference-temp-value');
    if (!slider || !display) return;
    slider.addEventListener('input', () => {
        display.textContent = parseFloat(slider.value).toFixed(1);
    });
}

export function getInferenceTemperature() {
    const el = document.getElementById('input-inference-temp');
    return el ? parseFloat(el.value) : 0;
}

export function updateParameterCount(count) {
    const el = document.getElementById('model-params');
    if (el) el.textContent = i18n.t('model.params').replace('—', count.toLocaleString());
}

/* ── Loss Chart ────────────────────────────────────────────────── */

const lossHistory = {
    policy: [],
    value: [],
    maxPoints: 100
};

export function addLossPoint(policyLoss, valueLoss) {
    if (Number.isNaN(policyLoss) || Number.isNaN(valueLoss)) return;
    lossHistory.policy.push(policyLoss);
    lossHistory.value.push(valueLoss);
    if (lossHistory.policy.length > lossHistory.maxPoints) {
        lossHistory.policy.shift();
        lossHistory.value.shift();
    }
    drawLossChart();
}

export function resetLossChart() {
    lossHistory.policy = [];
    lossHistory.value = [];
    drawLossChart();
}

function drawLossChart() {
    const canvas = document.getElementById('loss-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const pad = 20;
    const chartW = w - pad * 2;
    const chartH = h - pad * 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, w, h);

    if (lossHistory.policy.length < 2) {
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(i18n.t('metric.chartWaiting'), w / 2, h / 2);
        return;
    }

    // Find ranges
    const allValues = [...lossHistory.policy, ...lossHistory.value];
    const minVal = Math.min(...allValues) * 0.9;
    const maxVal = Math.max(...allValues) * 1.1;
    const range = maxVal - minVal || 1;

    // Grid lines
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = pad + chartH * (i / 4);
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(w - pad, y);
        ctx.stroke();
    }

    // Draw policy loss line
    drawLine(ctx, lossHistory.policy, minVal, range, chartW, chartH, pad, '#4fc3f7');

    // Draw value loss line
    drawLine(ctx, lossHistory.value, minVal, range, chartW, chartH, pad, '#ef5350');

    // Legend
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4fc3f7';
    ctx.fillText(i18n.t('metric.chartPolicy'), pad, pad - 6);
    ctx.fillStyle = '#ef5350';
    ctx.fillText(i18n.t('metric.chartValue'), pad + 60, pad - 6);

    // Y-axis labels
    ctx.fillStyle = '#a0a0a0';
    ctx.textAlign = 'right';
    ctx.font = '9px sans-serif';
    for (let i = 0; i <= 4; i++) {
        const val = maxVal - range * (i / 4);
        const y = pad + chartH * (i / 4);
        ctx.fillText(val.toFixed(2), pad - 4, y + 3);
    }
}

function drawLine(ctx, data, minVal, range, chartW, chartH, pad, color) {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < data.length; i++) {
        const x = pad + (i / (lossHistory.maxPoints - 1)) * chartW;
        const y = pad + chartH - ((data[i] - minVal) / range) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.stroke();
}
