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
    if (value === null || value === undefined) {
        el.textContent = 'Confianza: —';
    } else {
        const pct = ((value + 1) / 2 * 100).toFixed(0);
        el.textContent = `Confianza: ${value.toFixed(2)} (${pct}%)`;
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
        <label>Capa ${index + 1}:</label>
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
        row.querySelector('label').textContent = `Capa ${i + 1}:`;
    });
}

export function getTrainingConfig() {
    const numGames = parseInt(document.getElementById('input-games')?.value, 10);
    const lr = parseFloat(document.getElementById('input-lr')?.value);
    const batchSize = parseInt(document.getElementById('input-batch')?.value, 10);
    return {
        numGames: Number.isNaN(numGames) ? 500 : Math.max(1, numGames),
        lr: Number.isNaN(lr) ? 0.001 : Math.max(1e-6, lr),
        batchSize: Number.isNaN(batchSize) ? 64 : Math.max(1, batchSize)
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

export function setTrainingUI(isTraining) {
    const trainBtn = document.getElementById('btn-train');
    const stopBtn = document.getElementById('btn-stop-train');
    const newGameBtn = document.getElementById('btn-new-game');
    const resetBtn = document.getElementById('btn-reset');
    if (trainBtn) trainBtn.disabled = isTraining;
    if (stopBtn) stopBtn.disabled = !isTraining;
    if (newGameBtn) newGameBtn.disabled = isTraining;
    if (resetBtn) resetBtn.disabled = isTraining;
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
        if (el) el.textContent = data.policyLoss.toFixed(4);
    }
    if (data.valueLoss !== undefined) {
        const el = document.getElementById('metric-vloss');
        if (el) el.textContent = data.valueLoss.toFixed(4);
    }
}

export function resetMetrics() {
    const gamesEl = document.getElementById('metric-games');
    const winrateEl = document.getElementById('metric-winrate');
    const plossEl = document.getElementById('metric-ploss');
    const vlossEl = document.getElementById('metric-vloss');
    const progressEl = document.getElementById('train-progress');
    if (gamesEl) gamesEl.textContent = '0/0';
    if (winrateEl) winrateEl.textContent = '—';
    if (plossEl) plossEl.textContent = '—';
    if (vlossEl) vlossEl.textContent = '—';
    if (progressEl) progressEl.style.width = '0%';
}
