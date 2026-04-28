# Gato Neura Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a browser-only educational app that trains a neural network to play tic-tac-toe via self-play, with real-time model visualization and interactive gameplay.

**Architecture:** Vanilla JS with ES modules, TF.js from CDN for the neural network, SVG for model visualization, CSS Grid for responsive dashboard layout. No build step, no npm.

**Tech Stack:** HTML5, CSS3 (Grid/Flexbox), JavaScript ES Modules, TensorFlow.js (CDN), SVG

---

## File Structure

| File | Responsibility |
|------|---------------|
| `public/index.html` | Page structure, loads TF.js CDN and all modules |
| `public/css/styles.css` | Responsive dashboard layout, board styling, visualizer styling |
| `public/js/game.js` | Pure game logic: board representation, moves, winner detection |
| `public/js/model.js` | TF.js model creation with configurable layers, predict, getWeights |
| `public/js/trainer.js` | Self-play loop, training batch, progress callbacks |
| `public/js/visualizer.js` | SVG node graph rendering, heatmap rendering, real-time updates |
| `public/js/ui.js` | DOM bindings, board interaction, training controls, metrics display |
| `public/js/app.js` | Orchestrator: wires all modules, manages app state |
| `test-game.mjs` | Node.js tests for game.js (pure logic, no browser deps) |

---

### Task 1: HTML Structure and CSS Foundation

**Files:**
- Create: `public/index.html`
- Create: `public/css/styles.css`

- [ ] **Step 1: Create index.html with dashboard structure**

```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Gato Neura — Red Neuronal para Tic-Tac-Toe</title>
    <link rel="stylesheet" href="css/styles.css">
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js"></script>
</head>
<body>
    <header>
        <h1>Gato Neura</h1>
        <p>Red neuronal estilo AlphaZero para Tic-Tac-Toe</p>
    </header>
    <main class="dashboard">
        <section class="panel panel-model" id="panel-model">
            <h2>Modelo</h2>
            <div id="model-viz"></div>
            <div id="heatmap-container"></div>
            <div class="legend">
                <span class="legend-neg">Negativo</span>
                <span class="legend-zero">Cero</span>
                <span class="legend-pos">Positivo</span>
            </div>
        </section>
        <section class="panel panel-board" id="panel-board">
            <h2>Tablero</h2>
            <div class="game-info">
                <span id="turn-indicator">Tu turno (X)</span>
                <span id="confidence-display">Confianza: —</span>
            </div>
            <div class="board" id="board">
                <div class="cell" data-pos="0"></div>
                <div class="cell" data-pos="1"></div>
                <div class="cell" data-pos="2"></div>
                <div class="cell" data-pos="3"></div>
                <div class="cell" data-pos="4"></div>
                <div class="cell" data-pos="5"></div>
                <div class="cell" data-pos="6"></div>
                <div class="cell" data-pos="7"></div>
                <div class="cell" data-pos="8"></div>
            </div>
            <div class="board-controls">
                <button id="btn-new-game">Nueva Partida</button>
                <button id="btn-reset">Reiniciar Todo</button>
            </div>
            <div class="scoreboard" id="scoreboard">
                <span class="score score-player">Jugador: <strong id="score-player">0</strong></span>
                <span class="score score-draw">Empates: <strong id="score-draw">0</strong></span>
                <span class="score score-network">Red: <strong id="score-network">0</strong></span>
            </div>
        </section>
        <section class="panel panel-controls" id="panel-controls">
            <h2>Controles</h2>
            <div class="config-section">
                <h3>Arquitectura del Modelo</h3>
                <div id="layers-config"></div>
                <button id="btn-add-layer">+ Capa</button>
            </div>
            <div class="config-section">
                <h3>Entrenamiento</h3>
                <label>Partidas: <input type="range" id="input-games" min="100" max="5000" step="100" value="500"><span id="games-value">500</span></label>
                <label>Learning Rate: <input type="number" id="input-lr" value="0.001" step="0.0001" min="0.0001" max="0.1"></label>
                <label>Batch Size: <input type="number" id="input-batch" value="64" step="16" min="16" max="256"></label>
            </div>
            <div class="train-controls">
                <button id="btn-train" class="btn-primary">Entrenar</button>
                <button id="btn-stop-train" disabled>Detener</button>
            </div>
            <div class="metrics" id="metrics">
                <h3>Métricas</h3>
                <div class="progress-bar"><div class="progress-fill" id="train-progress"></div></div>
                <div class="metric"><span>Partidas:</span> <span id="metric-games">0/0</span></div>
                <div class="metric"><span>Win Rate:</span> <span id="metric-winrate">—</span></div>
                <div class="metric"><span>Policy Loss:</span> <span id="metric-ploss">—</span></div>
                <div class="metric"><span>Value Loss:</span> <span id="metric-vloss">—</span></div>
            </div>
        </section>
    </main>
    <script type="module" src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create styles.css with responsive dashboard layout**

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
    --bg: #1a1a2e;
    --surface: #16213e;
    --surface-light: #0f3460;
    --text: #e0e0e0;
    --text-muted: #a0a0a0;
    --accent: #e94560;
    --accent-hover: #ff6b81;
    --positive: #4fc3f7;
    --negative: #ef5350;
    --border: #2a2a4a;
    --radius: 8px;
}

body {
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
}

header {
    text-align: center;
    padding: 1rem;
    border-bottom: 1px solid var(--border);
}

header h1 { font-size: 1.5rem; color: var(--accent); }
header p { font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem; }

.dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
    padding: 1rem;
    max-width: 1400px;
    margin: 0 auto;
    align-items: start;
}

.panel {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 1rem;
    border: 1px solid var(--border);
}

.panel h2 {
    font-size: 1rem;
    margin-bottom: 0.75rem;
    color: var(--accent);
    border-bottom: 1px solid var(--border);
    padding-bottom: 0.5rem;
}

/* Board */
.board {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    max-width: 280px;
    margin: 0.75rem auto;
    aspect-ratio: 1;
}

.cell {
    background: var(--surface-light);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.2s;
    aspect-ratio: 1;
}

.cell:hover { background: #1a4a7a; }
.cell.x { color: var(--accent); }
.cell.o { color: var(--positive); }
.cell.winner { background: #2a5a2a; }

.game-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
}

.board-controls {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    margin-top: 0.75rem;
}

.scoreboard {
    display: flex;
    justify-content: space-around;
    margin-top: 0.75rem;
    font-size: 0.85rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
}

.score-player strong { color: var(--accent); }
.score-network strong { color: var(--positive); }

/* Controls */
.config-section {
    margin-bottom: 1rem;
}

.config-section h3 {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.config-section label {
    display: block;
    font-size: 0.85rem;
    margin-bottom: 0.4rem;
    color: var(--text-muted);
}

.config-section input[type="range"] { width: 60%; vertical-align: middle; }
.config-section input[type="number"] { width: 100px; padding: 0.25rem; background: var(--surface-light); border: 1px solid var(--border); color: var(--text); border-radius: 4px; }

#layers-config { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.5rem; }

.layer-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.layer-row label {
    font-size: 0.8rem;
    color: var(--text-muted);
    min-width: 60px;
}

.layer-row input {
    width: 70px;
    padding: 0.25rem;
    background: var(--surface-light);
    border: 1px solid var(--border);
    color: var(--text);
    border-radius: 4px;
}

.layer-row button {
    background: var(--negative);
    border: none;
    color: white;
    border-radius: 4px;
    width: 24px;
    height: 24px;
    cursor: pointer;
    font-size: 0.75rem;
}

.train-controls {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

button {
    padding: 0.5rem 1rem;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    background: var(--surface-light);
    color: var(--text);
    cursor: pointer;
    font-size: 0.85rem;
    transition: background 0.2s;
}

button:hover { background: #1a4a7a; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
button.btn-primary { background: var(--accent); border-color: var(--accent); }
button.btn-primary:hover { background: var(--accent-hover); }
button.btn-primary:disabled { background: var(--accent); }

/* Metrics */
.metrics h3 {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.progress-bar {
    background: var(--surface-light);
    border-radius: 4px;
    height: 8px;
    margin-bottom: 0.5rem;
    overflow: hidden;
}

.progress-fill {
    background: var(--accent);
    height: 100%;
    width: 0%;
    transition: width 0.3s;
}

.metric {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    padding: 0.2rem 0;
}

/* Model visualization */
#model-viz svg { width: 100%; height: auto; }
#heatmap-container { margin-top: 0.5rem; }
#heatmap-container svg { width: 100%; }

.legend {
    display: flex;
    justify-content: center;
    gap: 1rem;
    font-size: 0.75rem;
    margin-top: 0.5rem;
}

.legend-neg { color: var(--negative); }
.legend-zero { color: var(--text-muted); }
.legend-pos { color: var(--positive); }

/* Responsive */
@media (max-width: 1024px) {
    .dashboard {
        grid-template-columns: 1fr 1fr;
    }
    .panel-controls {
        grid-column: 1 / -1;
    }
}

@media (max-width: 640px) {
    .dashboard {
        grid-template-columns: 1fr;
    }
    .panel-controls {
        grid-column: auto;
    }
    .board { max-width: 240px; }
    .cell { font-size: 1.5rem; }
}
```

- [ ] **Step 3: Create empty JS module files**

Create all empty JS files so the HTML can load without errors:
- `public/js/game.js`
- `public/js/model.js`
- `public/js/trainer.js`
- `public/js/visualizer.js`
- `public/js/ui.js`
- `public/js/app.js`

Each file should export an empty object or placeholder function so imports don't break:
```js
// placeholder — will be replaced in subsequent tasks
export {};
```

- [ ] **Step 4: Verify in browser**

Open the page served by Caddy. Should see the dashboard layout with empty board cells, controls panel, and empty model visualization area. No console errors.

- [ ] **Step 5: Commit**

```bash
git add public/
git commit -m "feat: add HTML structure, CSS layout, and empty JS modules"
```

---

### Task 2: Game Engine

**Files:**
- Create: `public/js/game.js`
- Create: `test-game.mjs`

This is the only module with pure logic (no browser/TF.js deps), so it gets proper automated tests.

- [ ] **Step 1: Write game.js**

```js
export const EMPTY = 0;
export const PLAYER_X = 1;
export const PLAYER_O = -1;

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

export function createBoard() {
    return new Array(9).fill(EMPTY);
}

export function cloneBoard(board) {
    return [...board];
}

export function getValidMoves(board) {
    const moves = [];
    for (let i = 0; i < 9; i++) {
        if (board[i] === EMPTY) moves.push(i);
    }
    return moves;
}

export function makeMove(board, pos, player) {
    if (pos < 0 || pos > 8) return null;
    if (board[pos] !== EMPTY) return null;
    const next = cloneBoard(board);
    next[pos] = player;
    return next;
}

export function checkWinner(board) {
    for (const [a, b, c] of WIN_LINES) {
        if (board[a] !== EMPTY && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

export function isTerminal(board) {
    const winner = checkWinner(board);
    if (winner !== null) return { over: true, winner };
    if (getValidMoves(board).length === 0) return { over: true, winner: null };
    return { over: false, winner: null };
}

export function invertBoard(board) {
    return board.map(c => c === PLAYER_X ? PLAYER_O : c === PLAYER_O ? PLAYER_X : EMPTY);
}

export function boardToInput(board) {
    return board.map(c => c);
}
```

- [ ] **Step 2: Write test-game.mjs**

```js
import assert from 'node:assert/strict';
import {
    EMPTY, PLAYER_X, PLAYER_O,
    createBoard, cloneBoard, getValidMoves,
    makeMove, checkWinner, isTerminal, invertBoard
} from './public/js/game.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        passed++;
        console.log(`  ✓ ${name}`);
    } catch (e) {
        failed++;
        console.log(`  ✗ ${name}: ${e.message}`);
    }
}

console.log('createBoard');
test('returns array of 9 EMPTY', () => {
    const b = createBoard();
    assert.equal(b.length, 9);
    assert.ok(b.every(c => c === EMPTY));
});

console.log('getValidMoves');
test('empty board has 9 moves', () => {
    assert.deepEqual(getValidMoves(createBoard()), [0,1,2,3,4,5,6,7,8]);
});
test('partial board returns only empty indices', () => {
    const b = [PLAYER_X, EMPTY, PLAYER_O, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
    assert.deepEqual(getValidMoves(b), [1, 3, 4, 5, 6, 7, 8]);
});
test('full board has no moves', () => {
    const b = [PLAYER_X, PLAYER_O, PLAYER_X, PLAYER_O, PLAYER_X, PLAYER_O, PLAYER_O, PLAYER_X, PLAYER_O];
    assert.deepEqual(getValidMoves(b), []);
});

console.log('makeMove');
test('places piece on empty cell', () => {
    const b = makeMove(createBoard(), 4, PLAYER_X);
    assert.equal(b[4], PLAYER_X);
});
test('returns null for occupied cell', () => {
    const b = makeMove(createBoard(), 4, PLAYER_X);
    const result = makeMove(b, 4, PLAYER_O);
    assert.equal(result, null);
});
test('does not mutate original board', () => {
    const orig = createBoard();
    makeMove(orig, 0, PLAYER_X);
    assert.equal(orig[0], EMPTY);
});

console.log('checkWinner');
test('detects row win', () => {
    const b = [PLAYER_X, PLAYER_X, PLAYER_X, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
    assert.equal(checkWinner(b), PLAYER_X);
});
test('detects column win', () => {
    const b = [PLAYER_O, EMPTY, EMPTY, PLAYER_O, EMPTY, EMPTY, PLAYER_O, EMPTY, EMPTY];
    assert.equal(checkWinner(b), PLAYER_O);
});
test('detects diagonal win', () => {
    const b = [PLAYER_X, EMPTY, EMPTY, EMPTY, PLAYER_X, EMPTY, EMPTY, EMPTY, PLAYER_X];
    assert.equal(checkWinner(b), PLAYER_X);
});
test('returns null for no winner', () => {
    assert.equal(checkWinner(createBoard()), null);
});

console.log('isTerminal');
test('returns over:true with winner', () => {
    const b = [PLAYER_X, PLAYER_X, PLAYER_X, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
    const result = isTerminal(b);
    assert.equal(result.over, true);
    assert.equal(result.winner, PLAYER_X);
});
test('returns over:true for draw', () => {
    const b = [PLAYER_X, PLAYER_O, PLAYER_X, PLAYER_O, PLAYER_X, PLAYER_O, PLAYER_O, PLAYER_X, PLAYER_O];
    const result = isTerminal(b);
    assert.equal(result.over, true);
    assert.equal(result.winner, null);
});
test('returns over:false mid-game', () => {
    const b = [PLAYER_X, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
    const result = isTerminal(b);
    assert.equal(result.over, false);
});

console.log('invertBoard');
test('swaps X and O', () => {
    const b = [PLAYER_X, PLAYER_O, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
    const inv = invertBoard(b);
    assert.equal(inv[0], PLAYER_O);
    assert.equal(inv[1], PLAYER_X);
    assert.equal(inv[2], EMPTY);
});
test('does not mutate original', () => {
    const b = [PLAYER_X, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY];
    invertBoard(b);
    assert.equal(b[0], PLAYER_X);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
```

- [ ] **Step 3: Run tests**

Run: `node test-game.mjs`
Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add public/js/game.js test-game.mjs
git commit -m "feat: add game engine with tests"
```

---

### Task 3: Neural Network Model

**Files:**
- Create: `public/js/model.js`

- [ ] **Step 1: Write model.js**

```js
import { PLAYER_X, isTerminal } from './game.js';

export function createModel(hiddenLayers = [64, 32]) {
    const input = tf.input({ shape: [9], name: 'board_input' });

    let x = input;
    hiddenLayers.forEach((neurons, i) => {
        x = tf.layers.dense({
            units: neurons,
            activation: 'relu',
            name: `hidden_${i}`
        }).apply(x);
    });

    const policyHead = tf.layers.dense({
        units: 9,
        activation: 'softmax',
        name: 'policy'
    }).apply(x);

    const valueHead = tf.layers.dense({
        units: 1,
        activation: 'tanh',
        name: 'value'
    }).apply(x);

    const model = tf.model({
        inputs: input,
        outputs: [policyHead, valueHead],
        name: 'gato_neura'
    });

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: ['categoricalCrossentropy', 'meanSquaredError']
    });

    return model;
}

export async function predict(model, board) {
    const input = tf.tensor2d([board]);
    const [policyTensor, valueTensor] = model.predict(input);
    const policy = await policyTensor.array();
    const value = (await valueTensor.array())[0][0];
    input.dispose();
    policyTensor.dispose();
    valueTensor.dispose();
    return { policy: policy[0], value };
}

export function getWeights(model) {
    const weights = [];
    for (let i = 0; i < model.layers.length; i++) {
        const layer = model.layers[i];
        const layerWeights = layer.getWeights();
        if (layerWeights.length > 0) {
            weights.push({
                name: layer.name,
                kernel: layerWeights[0].arraySync(),
                bias: layerWeights[1] ? layerWeights[1].arraySync() : null
            });
        }
    }
    return weights;
}

export function getModelInfo(model) {
    const layerSizes = [9];
    for (const layer of model.layers) {
        const cfg = layer.getConfig();
        if (cfg.units) layerSizes.push(cfg.units);
    }
    return layerSizes;
}

export function disposeModel(model) {
    if (model) model.dispose();
}
```

- [ ] **Step 2: Verify in browser console**

Open the page, in DevTools console run:
```js
const m = GatoNeura.model.createModel();
m.summary();
```
Expected: model summary showing Input → hidden_0 → hidden_1 → policy + value outputs.

Note: this verification will work once app.js wires the exports (Task 7). For now, verify the file loads without syntax errors.

- [ ] **Step 3: Commit**

```bash
git add public/js/model.js
git commit -m "feat: add neural network model with configurable layers"
```

---

### Task 4: Self-Play Trainer

**Files:**
- Create: `public/js/trainer.js`

- [ ] **Step 1: Write trainer.js**

```js
import {
    createBoard, getValidMoves, makeMove,
    checkWinner, isTerminal, invertBoard,
    PLAYER_X, PLAYER_O
} from './game.js';
import { predict } from './model.js';

function maskInvalidMoves(policy, board) {
    const masked = new Array(9).fill(0);
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        if (board[i] === 0) {
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
    const {
        onGameComplete,
        onTrainStep,
        onComplete,
        shouldStop
    } = callbacks;

    const optimizer = tf.train.adam(lr);
    let totalGames = 0;
    let totalWins = 0;

    const allExamples = [];

    for (let g = 0; g < numGames; g++) {
        if (shouldStop && shouldStop()) break;

        const temperature = Math.max(0.1, 1.0 - (g / numGames) * 0.9);
        const examples = await playOneGame(model, temperature);
        allExamples.push(...examples);
        totalGames++;

        const lastEx = examples[examples.length - 1];
        if (lastEx.value > 0) totalWins++;

        if (onGameComplete) {
            onGameComplete({
                gamesPlayed: totalGames,
                totalGames: numGames,
                winRate: totalWins / totalGames
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

    optimizer.dispose();

    if (onComplete) onComplete({ totalGames, winRate: totalWins / totalGames });
}

async function trainOnBatch(model, batch, optimizer) {
    const inputs = batch.map(e => e.input);
    const policyTargets = batch.map(e => e.policy);
    const valueTargets = batch.map(e => [e.value]);

    const xs = tf.tensor2d(inputs);
    const policyYs = tf.tensor2d(policyTargets);
    const valueYs = tf.tensor2d(valueTargets);

    let policyLoss = 0;
    let valueLoss = 0;

    await optimizer.minimize(() => {
        const [pPred, vPred] = model.apply(xs);
        const pLoss = tf.losses.softmaxCrossEntropy(policyYs, pPred);
        const vLoss = tf.metrics.meanSquaredError(valueYs, vPred);
        const totalLoss = tf.add(pLoss, vLoss);
        policyLoss = pLoss.dataSync()[0];
        valueLoss = vLoss.dataSync()[0];
        return totalLoss;
    });

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
```

- [ ] **Step 2: Commit**

```bash
git add public/js/trainer.js
git commit -m "feat: add self-play trainer with policy/value training loop"
```

---

### Task 5: SVG Model Visualizer

**Files:**
- Create: `public/js/visualizer.js`

- [ ] **Step 1: Write visualizer.js**

```js
import { getWeights, getModelInfo } from './model.js';

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

    layerSizes.forEach((size, li) => {
        const x = layerSpacing * (li + 1);
        const displaySize = Math.min(size, maxNodes);
        const nodeSpacing = height / (displaySize + 1);
        const positions = [];

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
                svg.appendChild(text);
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
                svg.appendChild(circle);
            }
        }

        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', x);
        label.setAttribute('y', height - 5);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('fill', '#a0a0a0');
        label.setAttribute('font-size', '9');
        const layerNames = ['Entrada'];
        for (let i = 1; i < layerSizes.length - 2; i++) layerNames.push(`Oculta ${i}`);
        layerNames.push('Policy');
        layerNames.push('Value');
        label.textContent = layerNames[li] || `L${li}`;
        svg.appendChild(label);

        layerPositions.push(positions);
    });

    return layerPositions;
}

export function renderConnections(container, model, layerPositions) {
    const svg = container.querySelector('svg');
    if (!svg) return;

    const weights = getWeights(model);
    const svgNS = 'http://www.w3.org/2000/svg';
    const connectionsGroup = document.createElementNS(svgNS, 'g');
    connectionsGroup.setAttribute('class', 'connections');

    svg.insertBefore(connectionsGroup, svg.firstChild);

    for (let li = 0; li < layerPositions.length - 1; li++) {
        const kernel = weights[li] ? weights[li].kernel : null;
        if (!kernel) continue;

        const from = layerPositions[li];
        const to = layerPositions[li + 1];
        const maxConns = 50;
        let connCount = 0;

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

export function renderHeatmap(container, weights, layerIdx) {
    const svgNS = 'http://www.w3.org/2000/svg';
    if (!weights || !weights.kernel) {
        container.innerHTML = '<p style="color:#a0a0a0;font-size:0.8rem">Selecciona un nodo</p>';
        return;
    }

    const kernel = weights.kernel;
    const rows = kernel.length;
    const cols = kernel[0] ? kernel[0].length : 1;
    const cellSize = Math.min(12, Math.floor(240 / Math.max(rows, cols)));
    const width = cols * cellSize;
    const height = rows * cellSize;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('class', 'heatmap');
    container.innerHTML = '';
    container.appendChild(svg);

    const title = document.createElement('p');
    title.textContent = `Pesos: ${weights.name} (${rows}×${cols})`;
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
    renderConnections(container, model, layerPositions);

    const weights = getWeights(model);
    if (weights.length > 0) {
        renderHeatmap(heatmapContainer, weights[0], 0);
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add public/js/visualizer.js
git commit -m "feat: add SVG model visualizer with graph and heatmap"
```

---

### Task 6: UI Controller

**Files:**
- Create: `public/js/ui.js`

- [ ] **Step 1: Write ui.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add public/js/ui.js
git commit -m "feat: add UI controller for board, controls, and metrics"
```

---

### Task 7: App Orchestrator

**Files:**
- Create: `public/js/app.js`

- [ ] **Step 1: Write app.js**

```js
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
```

- [ ] **Step 2: Commit**

```bash
git add public/js/app.js
git commit -m "feat: add app orchestrator wiring all modules together"
```

---

### Task 8: Integration Verification and Polish

**Files:**
- Modify: `public/css/styles.css` (if needed)

- [ ] **Step 1: Serve via Caddy and test full flow**

Configure Caddy to serve `public/` on a path. Then test:

1. Page loads without console errors
2. Dashboard shows 3 panels in correct layout
3. Model graph renders with default architecture [64, 32]
4. Click cells on board — X appears, then network responds with O after 200ms delay
5. Game detects wins/losses/draws and shows result
6. Add/remove layer rows in config
7. Start training — progress bar moves, metrics update, visualization updates every 50 games
8. Stop training — stops cleanly
9. After training, play against trained network
10. Responsive: resize browser to mobile width, verify vertical stack

- [ ] **Step 2: Fix any issues found during testing**

Address any visual glitches, missing interactions, or console errors.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: integration polish and fixes"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All sections covered — model architecture (Task 3), game engine (Task 2), self-play/training (Task 4), visualizer (Task 5), UI dashboard (Task 6), app wiring (Task 7), responsive CSS (Task 1)
- [x] **Placeholder scan:** No TBDs, TODOs, or vague references
- [x] **Type consistency:** Function names and signatures consistent across tasks (e.g., `getLayersConfig()` defined in Task 6, used in Task 7)
- [x] **Configurable architecture:** Covered — add/remove layers, neuron count per layer (Task 6 + Task 7)
- [x] **Real-time visualization update:** Covered — every 50 games during training (Task 7)
- [x] **Responsive layout:** Covered — CSS breakpoints at 1024px and 640px (Task 1)
