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
