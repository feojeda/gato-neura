import { getWeights, getModelInfo } from './model.js';
import * as i18n from './i18n.js';

function weightToColor(w) {
    if (w >= 0) {
        const intensity = Math.min(1, Math.abs(w));
        return `rgba(79, 195, 247, ${intensity * 0.9})`;
    } else {
        const intensity = Math.min(1, Math.abs(w));
        return `rgba(239, 83, 80, ${intensity * 0.9})`;
    }
}

export function renderGraph(container, model) {
    const layerSizes = getModelInfo(model);
    const svgNS = 'http://www.w3.org/2000/svg';
    const width = 400;
    const maxNodes = 12;
    const layerSpacing = width / (layerSizes.length + 1);
    const height = 360;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'model-graph');
    container.innerHTML = '';
    container.appendChild(svg);

    const layerPositions = [];

    const layerNames = [i18n.t('model.input')];
    for (let i = 1; i < layerSizes.length - 2; i++) layerNames.push(i18n.t('model.hidden', { n: i }));
    layerNames.push(i18n.t('model.policy'));
    layerNames.push(i18n.t('model.value'));

    layerSizes.forEach((size, li) => {
        const x = layerSpacing * (li + 1);
        const displaySize = Math.min(size, maxNodes);
        const nodeSpacing = height / (displaySize + 1);
        const positions = [];
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
                text.textContent = `+${size - maxNodes}`;
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

        layerPositions.push(positions);
    });

    return layerPositions;
}

export function renderConnections(container, weights, layerPositions) {
    const svg = container.querySelector('svg');
    if (!svg) return;

    const svgNS = 'http://www.w3.org/2000/svg';
    const connectionsGroup = document.createElementNS(svgNS, 'g');
    connectionsGroup.setAttribute('class', 'connections');

    svg.insertBefore(connectionsGroup, svg.firstChild);

    const maxConns = 50;
    let connCount = 0;

    for (let li = 0; li < layerPositions.length - 1 && connCount < maxConns; li++) {
        const kernel = weights[li] ? weights[li].kernel : null;
        if (!kernel) continue;

        const from = layerPositions[li];
        const to = layerPositions[li + 1];

        for (let fi = 0; fi < from.length && connCount < maxConns; fi++) {
            for (let ti = 0; ti < to.length && connCount < maxConns; ti++) {
                const kernelIdx = fi < kernel.length && ti < (kernel[fi] ? kernel[fi].length : 0) ? ti : -1;
                const w = kernelIdx >= 0 && kernel[fi] ? kernel[fi][kernelIdx] : 0;

                const line = document.createElementNS(svgNS, 'line');
                line.setAttribute('x1', from[fi].x);
                line.setAttribute('y1', from[fi].y);
                line.setAttribute('x2', to[ti].x);
                line.setAttribute('y2', to[ti].y);
                line.setAttribute('stroke', weightToColor(w));
                line.setAttribute('stroke-width', '0.5');
                line.setAttribute('stroke-opacity', Math.min(0.6, Math.abs(w) * 0.3 + 0.05));
                connectionsGroup.appendChild(line);
                connCount++;
            }
        }
    }
}

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

export function updateVisualization(container, heatmapContainer, model) {
    const layerPositions = renderGraph(container, model);
    const weights = getWeights(model);
    renderConnections(container, weights, layerPositions);

    if (weights.length > 0) {
        renderHeatmap(heatmapContainer, weights[0]);
    }
}
