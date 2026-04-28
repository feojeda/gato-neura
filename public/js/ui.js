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
    document.getElementById('turn-indicator').textContent = text;
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
    document.getElementById('score-player').textContent = scores.player;
    document.getElementById('score-draw').textContent = scores.draw;
    document.getElementById('score-network').textContent = scores.network;
}

export function initLayersConfig(defaultLayers = [64, 32]) {
    const container = document.getElementById('layers-config');
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
    btn.addEventListener('click', () => {
        const container = document.getElementById('layers-config');
        const count = container.children.length;
        if (count >= 5) return;
        addLayerRow(container, count, 32);
        onClick();
    });
}

export function initRemoveLayerButtons(onClick) {
    document.getElementById('layers-config').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-layer')) {
            const container = document.getElementById('layers-config');
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
    return {
        numGames: parseInt(document.getElementById('input-games').value, 10),
        lr: parseFloat(document.getElementById('input-lr').value),
        batchSize: parseInt(document.getElementById('input-batch').value, 10)
    };
}

export function initGamesSlider() {
    const slider = document.getElementById('input-games');
    const display = document.getElementById('games-value');
    slider.addEventListener('input', () => {
        display.textContent = slider.value;
    });
}

export function setTrainingUI(isTraining) {
    document.getElementById('btn-train').disabled = isTraining;
    document.getElementById('btn-stop-train').disabled = !isTraining;
    setLayersConfigEditable(!isTraining);
}

export function updateMetrics(data) {
    if (data.gamesPlayed !== undefined) {
        document.getElementById('metric-games').textContent = `${data.gamesPlayed}/${data.totalGames}`;
        const pct = (data.gamesPlayed / data.totalGames * 100).toFixed(0);
        document.getElementById('train-progress').style.width = `${pct}%`;
    }
    if (data.winRate !== undefined) {
        document.getElementById('metric-winrate').textContent = (data.winRate * 100).toFixed(1) + '%';
    }
    if (data.policyLoss !== undefined) {
        document.getElementById('metric-ploss').textContent = data.policyLoss.toFixed(4);
    }
    if (data.valueLoss !== undefined) {
        document.getElementById('metric-vloss').textContent = data.valueLoss.toFixed(4);
    }
}

export function resetMetrics() {
    document.getElementById('metric-games').textContent = '0/0';
    document.getElementById('metric-winrate').textContent = '—';
    document.getElementById('metric-ploss').textContent = '—';
    document.getElementById('metric-vloss').textContent = '—';
    document.getElementById('train-progress').style.width = '0%';
}
