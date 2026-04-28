export const EMPTY = 0;
export const PLAYER_X = 1;
export const PLAYER_O = -1;

export const WIN_LINES = [
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
