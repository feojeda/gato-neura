import { chromium } from '@playwright/test';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');
const PORT = 8765;

function serveStatic(req, res) {
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(PUBLIC_DIR, urlPath === '/' ? 'index.html' : urlPath);
    const ext = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
    };
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not found');
            return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
    });
}

const server = http.createServer(serveStatic);
await new Promise(r => server.listen(PORT, r));
console.log(`Server running on http://localhost:${PORT}`);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

const consoleErrors = [];
page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
        consoleErrors.push(text);
    }
    console.log(`[console ${type}] ${text}`);
});

page.on('pageerror', err => {
    consoleErrors.push(err.message);
    console.log(`[page error] ${err.message}`);
});

await page.goto(`http://localhost:${PORT}?nocache=${Date.now()}`);

// Wait for TF.js to load
await page.waitForFunction(() => typeof tf !== 'undefined', { timeout: 15000 });
console.log('TensorFlow.js loaded');

// Helper to read metrics
async function readMetrics() {
    return page.evaluate(() => ({
        games: document.getElementById('metric-games')?.textContent,
        winRate: document.getElementById('metric-winrate')?.textContent,
        pLoss: document.getElementById('metric-ploss')?.textContent,
        vLoss: document.getElementById('metric-vloss')?.textContent,
    }));
}

// Helper to set training config
async function setConfig(games, incremental) {
    await page.evaluate(({ g, inc }) => {
        const slider = document.getElementById('input-games');
        slider.value = String(g);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('input-incremental').checked = inc;
    }, { g: games, inc: incremental });
}

// Helper to wait for training to finish
async function waitForTraining() {
    await page.waitForFunction(() => {
        const trainBtn = document.getElementById('btn-train');
        return trainBtn && !trainBtn.disabled;
    }, { timeout: 300000 });
    await page.waitForTimeout(300);
}

// Test 1: Basic training
console.log('\n--- Test 1: Basic training (200 games) ---');
await setConfig(200, false);
await page.click('#btn-train');
await waitForTraining();
const metrics1 = await readMetrics();
console.log('Metrics:', metrics1);

// Test 2: Incremental training
console.log('\n--- Test 2: Incremental training (+30 games) ---');
await setConfig(30, true);
await page.click('#btn-train');
await waitForTraining();
const metrics2 = await readMetrics();
console.log('Metrics:', metrics2);

// Test 3: Reset model
console.log('\n--- Test 3: Reset model ---');
await page.click('#btn-reset-model');
await page.waitForTimeout(500);
const modelViz = await page.evaluate(() =>
    document.getElementById('model-viz').innerHTML.length > 0
);
console.log('Model visualization after reset:', modelViz ? 'OK' : 'EMPTY');

// Test 4: Trained model plays differently than untrained
console.log('\n--- Test 4: Trained vs untrained move ---');

// Train a fresh model
await setConfig(300, false);
await page.click('#btn-train');
await waitForTraining();

// Query move on empty board directly via exposed function
const trainedMove = await page.evaluate(async () => {
    return window.__getNetworkMove([0,0,0,0,0,0,0,0,0]);
});
console.log('Trained model empty-board move:', trainedMove);

// Query move on a board where there is an obvious winning move
const trainedWin = await page.evaluate(async () => {
    // Board: X X _ / O _ _ / _ _ _  (X can win with pos 2)
    return window.__getNetworkMove([1,1,0,-1,0,0,0,0,0]);
});
console.log('Trained model winning-move board:', trainedWin);

// Reset model
await page.click('#btn-reset-model');
await page.waitForTimeout(500);

const untrainedMove = await page.evaluate(async () => {
    return window.__getNetworkMove([0,0,0,0,0,0,0,0,0]);
});
console.log('Untrained model empty-board move:', untrainedMove);

const untrainedWin = await page.evaluate(async () => {
    return window.__getNetworkMove([1,1,0,-1,0,0,0,0,0]);
});
console.log('Untrained model winning-move board:', untrainedWin);

const movesDiffer = trainedMove !== untrainedMove || trainedWin !== untrainedWin;
console.log('Moves differ:', movesDiffer);

// Test 5: Network can start the game
console.log('\n--- Test 5: Network starts game ---');
await page.evaluate(() => {
    document.getElementById('starting-player').value = 'network';
});
await page.click('#btn-new-game');
await page.waitForTimeout(800);

const boardHasMove = await page.evaluate(() => {
    const cells = document.querySelectorAll('.cell');
    return Array.from(cells).some(c => c.textContent !== '');
});
console.log('Board has network move on start:', boardHasMove);

await browser.close();
server.close();

// Final validation
const trainingErrors = consoleErrors.filter(e =>
    e.includes('trainOnBatch') || e.includes('Training error')
);

console.log('\n=============================');
let failed = false;

if (trainingErrors.length > 0) {
    console.log(`FAILED: ${trainingErrors.length} training errors found`);
    trainingErrors.forEach(e => console.log('  -', e));
    failed = true;
}

if (!movesDiffer) {
    console.log('FAILED: Trained and untrained models made the same first move');
    failed = true;
}

if (!boardHasMove) {
    console.log('FAILED: Network did not make a move when starting');
    failed = true;
}

if (!failed) {
    console.log('ALL TESTS PASSED');
} else {
    process.exit(1);
}
console.log('=============================');
