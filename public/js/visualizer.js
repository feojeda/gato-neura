import { getWeights, getModelInfo } from './model.js';
import * as i18n from './i18n.js';

/* ── Helpers ─────────────────────────────────────────────────── */

function weightToColor(w) {
    if (w >= 0) {
        const intensity = Math.min(1, Math.abs(w));
        return `rgba(79, 195, 247, ${intensity * 0.9})`;
    } else {
        const intensity = Math.min(1, Math.abs(w));
        return `rgba(239, 83, 80, ${intensity * 0.9})`;
    }
}

function weightStrokeColor(w) {
    return w >= 0 ? '#4fc3f7' : '#ef5350';
}

function valueToColor(v) {
    v = Math.max(-1, Math.min(1, v));
    let r, g, b;
    if (v >= 0) {
        r = Math.round(128 + (76 - 128) * v);
        g = Math.round(128 + (175 - 128) * v);
        b = Math.round(128 + (80 - 128) * v);
    } else {
        const t = -v;
        r = Math.round(128 + (239 - 128) * t);
        g = Math.round(128 + (83 - 128) * t);
        b = Math.round(128 + (80 - 128) * t);
    }
    return `rgb(${r}, ${g}, ${b})`;
}

/* ── Tooltip ─────────────────────────────────────────────────── */

function getTooltip() {
    let tooltip = document.getElementById('viz-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'viz-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0,0,0,0.9);
            color: #fff;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 10000;
            display: none;
            border: 1px solid #4fc3f7;
            font-family: sans-serif;
        `;
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

function showTooltip(event, weight) {
    const tooltip = getTooltip();
    tooltip.textContent = `w = ${weight.toFixed(4)}`;
    tooltip.style.display = 'block';
    tooltip.style.left = (event.clientX + 12) + 'px';
    tooltip.style.top = (event.clientY - 28) + 'px';
}

function hideTooltip() {
    const tooltip = getTooltip();
    if (tooltip) tooltip.style.display = 'none';
}

/* ── 3×3 Board ───────────────────────────────────────────────── */

function createBoard3x3(svgNS, data, options = {}) {
    const { width = 60, isPolicy = false, isInput = false } = options;
    const group = document.createElementNS(svgNS, 'g');
    const cellSize = width / 3;
    const cells = [];

    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('width', width);
    bg.setAttribute('height', width);
    bg.setAttribute('fill', '#1a1a2e');
    bg.setAttribute('stroke', '#4fc3f7');
    bg.setAttribute('stroke-width', '1');
    bg.setAttribute('rx', '2');
    group.appendChild(bg);

    for (let i = 1; i < 3; i++) {
        const hLine = document.createElementNS(svgNS, 'line');
        hLine.setAttribute('x1', 0);
        hLine.setAttribute('y1', i * cellSize);
        hLine.setAttribute('x2', width);
        hLine.setAttribute('y2', i * cellSize);
        hLine.setAttribute('stroke', '#4fc3f7');
        hLine.setAttribute('stroke-width', '0.5');
        group.appendChild(hLine);

        const vLine = document.createElementNS(svgNS, 'line');
        vLine.setAttribute('x1', i * cellSize);
        vLine.setAttribute('y1', 0);
        vLine.setAttribute('x2', i * cellSize);
        vLine.setAttribute('y2', width);
        vLine.setAttribute('stroke', '#4fc3f7');
        vLine.setAttribute('stroke-width', '0.5');
        group.appendChild(vLine);
    }

    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            const idx = r * 3 + c;
            const value = data[idx] || 0;
            const cellGroup = document.createElementNS(svgNS, 'g');

            const cellRect = document.createElementNS(svgNS, 'rect');
            cellRect.setAttribute('x', c * cellSize + 0.5);
            cellRect.setAttribute('y', r * cellSize + 0.5);
            cellRect.setAttribute('width', cellSize - 1);
            cellRect.setAttribute('height', cellSize - 1);
            cellRect.setAttribute('fill', isPolicy ? `rgba(79, 195, 247, ${Math.min(0.9, value * 0.85)})` : 'transparent');
            cellRect.setAttribute('rx', '1');
            cellGroup.appendChild(cellRect);

            const text = document.createElementNS(svgNS, 'text');
            text.setAttribute('x', c * cellSize + cellSize / 2);
            text.setAttribute('y', r * cellSize + cellSize / 2 + (isPolicy ? 3 : 5));
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#e0e0e0');
            text.setAttribute('font-size', isPolicy ? '8' : '14');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('pointer-events', 'none');
            text.textContent = isPolicy
                ? `${(value * 100).toFixed(0)}%`
                : (value > 0 ? 'X' : value < 0 ? 'O' : '');
            cellGroup.appendChild(text);

            cellRect.style.cursor = 'pointer';
            cellRect.setAttribute('data-layer', isInput ? 0 : 3);
            cellRect.setAttribute('data-node', idx);

            group.appendChild(cellGroup);
            cells.push({ rect: cellRect, text, group: cellGroup, value });
        }
    }

    return { group, cells };
}

/* ── Value Node ──────────────────────────────────────────────── */

function createValueNode(svgNS, value) {
    const group = document.createElementNS(svgNS, 'g');
    const radius = 18;

    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', valueToColor(value));
    circle.setAttribute('stroke', '#2a2a4a');
    circle.setAttribute('stroke-width', '2');
    circle.setAttribute('data-layer', 4);
    circle.setAttribute('data-node', 0);
    circle.style.cursor = 'pointer';
    group.appendChild(circle);

    const text = document.createElementNS(svgNS, 'text');
    text.setAttribute('y', 4);
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#fff');
    text.setAttribute('font-size', '11');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('pointer-events', 'none');
    text.textContent = value.toFixed(2);
    group.appendChild(text);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('y', radius + 14);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', '#a0a0a0');
    label.setAttribute('font-size', '10');
    label.textContent = i18n.t('model.value');
    group.appendChild(label);

    return { group, circle, text, label };
}

/* ── Zoom ────────────────────────────────────────────────────── */

function handleZoom(svg, layerIndex, nodeIndex, layerElements) {
    svg.__zoomState = { layerIndex, nodeIndex };

    layerElements.forEach((layer, li) => {
        if (layer.type === 'board') {
            layer.cells.forEach((cell, ci) => {
                const dimmed = !(li === layerIndex && ci === nodeIndex);
                cell.group.setAttribute('opacity', dimmed ? '0.25' : '1');
            });
        } else if (layer.type === 'nodes') {
            layer.nodes.forEach((node, ni) => {
                const dimmed = !(li === layerIndex && ni === nodeIndex);
                node.setAttribute('opacity', dimmed ? '0.25' : '1');
            });
        } else if (layer.type === 'value') {
            const dimmed = li !== layerIndex;
            layer.group.setAttribute('opacity', dimmed ? '0.25' : '1');
        }
    });

    const connectionsGroup = svg.querySelector('.connections');
    if (connectionsGroup) {
        Array.from(connectionsGroup.children).forEach(line => {
            const fromLayer = parseInt(line.dataset.fromLayer);
            const fromNode = parseInt(line.dataset.fromNode);
            const toLayer = parseInt(line.dataset.toLayer);
            const toNode = parseInt(line.dataset.toNode);

            const isConnected = (fromLayer === layerIndex && fromNode === nodeIndex) ||
                                (toLayer === layerIndex && toNode === nodeIndex);

            if (isConnected) {
                line.style.display = 'block';
                line.setAttribute('stroke-opacity', '0.9');
                const w = parseFloat(line.dataset.weight);
                line.setAttribute('stroke-width', Math.max(1, Math.min(3, Math.abs(w) * 3)).toFixed(2));
            } else {
                line.style.display = 'none';
            }
        });
    }
}

function clearZoom(svg) {
    delete svg.__zoomState;

    const layerElements = svg.__layerElements;
    if (layerElements) {
        layerElements.forEach(layer => {
            if (layer.type === 'board') {
                layer.cells.forEach(cell => cell.group.setAttribute('opacity', '1'));
            } else if (layer.type === 'nodes') {
                layer.nodes.forEach(node => node.setAttribute('opacity', '1'));
            } else if (layer.type === 'value') {
                layer.group.setAttribute('opacity', '1');
            }
        });
    }

    const connectionsGroup = svg.querySelector('.connections');
    if (connectionsGroup) {
        Array.from(connectionsGroup.children).forEach(line => {
            const w = parseFloat(line.dataset.weight);
            line.setAttribute('stroke-opacity', Math.min(0.9, Math.abs(w) * 0.8 + 0.1).toFixed(3));
            line.setAttribute('stroke-width', Math.max(0.5, Math.min(3, Math.abs(w) * 3)).toFixed(2));
            line.style.display = 'block';
        });
    }
}

/* ── Graph Rendering ─────────────────────────────────────────── */

export function renderGraph(container, model, options = {}) {
    const layerSizes = getModelInfo(model);
    const svgNS = 'http://www.w3.org/2000/svg';
    const width = 700;
    const height = 400;
    const boardSize = 60;
    const maxNodes = 12;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'model-graph');
    container.innerHTML = '';
    container.appendChild(svg);

    const layerElements = [];

    const layerNames = [i18n.t('model.input')];
    for (let i = 1; i < layerSizes.length - 2; i++) layerNames.push(i18n.t('model.hidden', { n: i }));
    layerNames.push(i18n.t('model.policy'));
    layerNames.push(i18n.t('model.value'));

    const hiddenLayerCount = layerSizes.length - 3; // excluding input, policy, value
    const leftX = 90;
    const rightX = 610;
    const segmentWidth = hiddenLayerCount > 0 ? (rightX - leftX) / (hiddenLayerCount + 1) : 0;

    const xPositions = [];
    xPositions.push(leftX);
    for (let i = 1; i <= hiddenLayerCount; i++) {
        xPositions.push(leftX + segmentWidth * i);
    }
    xPositions.push(rightX); // policy
    xPositions.push(rightX); // value (same x, different y)

    // Input board
    {
        const inputData = options.boardState || new Array(9).fill(0);
        const board = createBoard3x3(svgNS, inputData, { width: boardSize, isInput: true });
        const x = xPositions[0];
        const y = (height - boardSize) / 2;
        board.group.setAttribute('transform', `translate(${x - boardSize / 2}, ${y})`);
        svg.appendChild(board.group);

        const positions = [];
        const cellSize = boardSize / 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                positions.push({
                    x: x - boardSize / 2 + c * cellSize + cellSize / 2,
                    y: y + r * cellSize + cellSize / 2
                });
            }
        }

        layerElements.push({
            type: 'board',
            group: board.group,
            cells: board.cells,
            positions,
            x: x - boardSize / 2,
            y,
            width: boardSize,
            isInput: true
        });
    }

    // Hidden layers
    for (let li = 1; li <= hiddenLayerCount; li++) {
        const size = layerSizes[li];
        const x = xPositions[li];
        const displaySize = Math.min(size, maxNodes);
        const nodeSpacing = height / (displaySize + 1);
        const positions = [];
        const nodes = [];
        const fragment = document.createDocumentFragment();

        for (let ni = 0; ni < displaySize; ni++) {
            const y = nodeSpacing * (ni + 1);
            positions.push({ x, y });

            if (size > maxNodes && ni === displaySize - 1) {
                const text = document.createElementNS(svgNS, 'text');
                text.setAttribute('x', x);
                text.setAttribute('y', y + 4);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', '#a0a0a0');
                text.setAttribute('font-size', '10');
                text.textContent = `+${size - maxNodes + 1}`;
                fragment.appendChild(text);
            } else {
                const circle = document.createElementNS(svgNS, 'circle');
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', 6);
                circle.setAttribute('fill', '#4fc3f7');
                circle.setAttribute('stroke', '#2a2a4a');
                circle.setAttribute('stroke-width', '1');
                circle.setAttribute('data-layer', li);
                circle.setAttribute('data-node', ni);
                circle.style.cursor = 'pointer';
                fragment.appendChild(circle);
                nodes.push(circle);
            }
        }

        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', height - 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#a0a0a0');
        label.setAttribute('font-size', '9');
        label.textContent = layerNames[li] || `L${li}`;
        fragment.appendChild(label);
        svg.appendChild(fragment);

        layerElements.push({
            type: 'nodes',
            group: fragment,
            nodes,
            positions,
            x,
            isHidden: true
        });
    }

    // Policy board
    {
        const policyData = options.policy || new Array(9).fill(0);
        const board = createBoard3x3(svgNS, policyData, { width: boardSize, isPolicy: true });
        const x = xPositions[xPositions.length - 2];
        const y = 110;
        board.group.setAttribute('transform', `translate(${x - boardSize / 2}, ${y})`);
        svg.appendChild(board.group);

        const positions = [];
        const cellSize = boardSize / 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                positions.push({
                    x: x - boardSize / 2 + c * cellSize + cellSize / 2,
                    y: y + r * cellSize + cellSize / 2
                });
            }
        }

        layerElements.push({
            type: 'board',
            group: board.group,
            cells: board.cells,
            positions,
            x: x - boardSize / 2,
            y,
            width: boardSize,
            isPolicy: true
        });
    }

    // Value node
    {
        const value = options.value !== undefined ? options.value : 0;
        const node = createValueNode(svgNS, value);
        const x = xPositions[xPositions.length - 1];
        const y = 260;
        node.group.setAttribute('transform', `translate(${x}, ${y})`);
        svg.appendChild(node.group);

        layerElements.push({
            type: 'value',
            group: node.group,
            node: node.circle,
            text: node.text,
            label: node.label,
            positions: [{ x, y }],
            x,
            y,
            isValue: true
        });
    }

    // Click handlers for zoom
    svg.addEventListener('click', (e) => {
        const target = e.target;
        const layer = target.getAttribute('data-layer');
        const node = target.getAttribute('data-node');
        if (layer !== null && node !== null) {
            handleZoom(svg, parseInt(layer), parseInt(node), layerElements);
        } else {
            clearZoom(svg);
        }
    });

    svg.__layerElements = layerElements;
    container.__vizLayerElements = layerElements;

    return layerElements;
}

/* ── Connections ─────────────────────────────────────────────── */

export function renderConnections(container, weights, layerElements) {
    const svg = container.querySelector('svg');
    if (!svg || !layerElements) return;

    const svgNS = 'http://www.w3.org/2000/svg';
    let connectionsGroup = svg.querySelector('.connections');
    if (connectionsGroup) connectionsGroup.remove();
    connectionsGroup = document.createElementNS(svgNS, 'g');
    connectionsGroup.setAttribute('class', 'connections');
    svg.insertBefore(connectionsGroup, svg.firstChild);

    if (!weights || !Array.isArray(weights)) return;

    // Map weights to correct source/target layers
    const mappings = weights.map((w, wi) => {
        if (w.name === 'policy') return { wi, fromLayer: 2, toLayer: 3 };
        if (w.name === 'value') return { wi, fromLayer: 2, toLayer: 4 };
        return { wi, fromLayer: wi, toLayer: wi + 1 };
    });

    const connections = [];

    for (const { wi, fromLayer, toLayer } of mappings) {
        const kernel = weights[wi]?.kernel;
        if (!kernel) continue;

        const fromEl = layerElements[fromLayer];
        const toEl = layerElements[toLayer];
        if (!fromEl || !toEl) continue;

        for (let fi = 0; fi < fromEl.positions.length; fi++) {
            for (let ti = 0; ti < toEl.positions.length; ti++) {
                const w = kernel[fi] !== undefined && kernel[fi][ti] !== undefined ? kernel[fi][ti] : 0;
                connections.push({
                    wi,
                    fromLayer,
                    toLayer,
                    fi,
                    ti,
                    w,
                    fromPos: fromEl.positions[fi],
                    toPos: toEl.positions[ti]
                });
            }
        }
    }

    // Sort by absolute magnitude, strongest first
    connections.sort((a, b) => Math.abs(b.w) - Math.abs(a.w));

    const maxConns = 500;
    const toDraw = connections.slice(0, maxConns);

    for (const conn of toDraw) {
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', conn.fromPos.x);
        line.setAttribute('y1', conn.fromPos.y);
        line.setAttribute('x2', conn.toPos.x);
        line.setAttribute('y2', conn.toPos.y);
        line.setAttribute('stroke', weightStrokeColor(conn.w));
        const absW = Math.min(1, Math.abs(conn.w));
        line.setAttribute('stroke-width', Math.max(0.5, absW * 3).toFixed(2));
        line.setAttribute('stroke-opacity', Math.min(0.9, absW * 0.8 + 0.1).toFixed(3));
        line.setAttribute('stroke-linecap', 'round');
        line.dataset.fromLayer = conn.fromLayer;
        line.dataset.fromNode = conn.fi;
        line.dataset.toLayer = conn.toLayer;
        line.dataset.toNode = conn.ti;
        line.dataset.weight = conn.w;
        line.style.cursor = 'crosshair';

        line.addEventListener('mouseenter', (e) => showTooltip(e, conn.w));
        line.addEventListener('mouseleave', hideTooltip);
        line.addEventListener('mousemove', (e) => showTooltip(e, conn.w));

        connectionsGroup.appendChild(line);
    }
}

/* ── Heatmap (kept compatible) ───────────────────────────────── */

const MAX_HEATMAP_CELLS = 2500;

export function renderHeatmap(container, weights) {
    const svgNS = 'http://www.w3.org/2000/svg';
    if (!weights || !weights.kernel) {
        container.innerHTML = `<p style="color:#a0a0a0;font-size:0.8rem">${i18n.t('visualizer.selectNode')}</p>`;
        return;
    }

    const kernel = weights.kernel;
    const rows = kernel.length;
    const cols = kernel[0] ? kernel[0].length : 1;

    if (rows * cols > MAX_HEATMAP_CELLS) {
        container.innerHTML = `<p style="color:#a0a0a0;font-size:0.8rem">${i18n.t('visualizer.matrixTooLarge', { r: rows, c: cols })}</p>`;
        return;
    }

    const cellSize = Math.min(12, Math.floor(240 / Math.max(rows, cols)));
    const width = cols * cellSize;
    const height = rows * cellSize;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'heatmap');
    container.innerHTML = '';
    container.appendChild(svg);

    const title = document.createElement('p');
    title.textContent = i18n.t('visualizer.weights', { name: weights.name, r: rows, c: cols });
    title.style.cssText = 'color:#a0a0a0;font-size:0.75rem;margin-bottom:0.25rem;';
    container.insertBefore(title, svg);

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const w = kernel[r][c];
            const rect = document.createElementNS(svgNS, 'rect');
            rect.setAttribute('x', c * cellSize);
            rect.setAttribute('y', r * cellSize);
            rect.setAttribute('width', cellSize - 1);
            rect.setAttribute('height', cellSize - 1);
            rect.setAttribute('fill', weightToColor(w));
            rect.setAttribute('rx', '1');
            svg.appendChild(rect);
        }
    }
}

/* ── Dynamic Updates ─────────────────────────────────────────── */

export function updateDynamicVisualization(container, boardState, prediction) {
    const svg = container.querySelector('svg');
    if (!svg) return;

    const layerElements = svg.__layerElements || container.__vizLayerElements;
    if (!layerElements) return;

    // Update input board
    const inputLayer = layerElements[0];
    if (inputLayer && inputLayer.type === 'board') {
        boardState.forEach((val, i) => {
            const cell = inputLayer.cells[i];
            if (cell) {
                cell.text.textContent = val > 0 ? 'X' : val < 0 ? 'O' : '';
                cell.value = val;
            }
        });
    }

    // Update policy board
    const policyLayer = layerElements.find(l => l.isPolicy);
    if (policyLayer && policyLayer.type === 'board' && prediction && prediction.policy) {
        prediction.policy.forEach((val, i) => {
            const cell = policyLayer.cells[i];
            if (cell) {
                const v = Math.max(0, Math.min(1, val));
                cell.rect.setAttribute('fill', `rgba(79, 195, 247, ${v * 0.85})`);
                cell.text.textContent = `${(v * 100).toFixed(0)}%`;
                cell.value = v;
            }
        });
    }

    // Update value node
    const valueLayer = layerElements.find(l => l.isValue);
    if (valueLayer && valueLayer.type === 'value' && prediction && prediction.value !== undefined) {
        const v = Math.max(-1, Math.min(1, prediction.value));
        valueLayer.node.setAttribute('fill', valueToColor(v));
        valueLayer.text.textContent = v.toFixed(2);
    }
}

/* ── Main Orchestrator ───────────────────────────────────────── */

export function updateVisualization(container, heatmapContainer, model, options = {}) {
    const layerElements = renderGraph(container, model, options);
    const weights = getWeights(model);
    renderConnections(container, weights, layerElements);

    if (weights.length > 0) {
        renderHeatmap(heatmapContainer, weights[0]);
    }
}


