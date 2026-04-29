# How Neural Networks Learn to Play Games: An Interactive Browser Tutorial

*Watch a neural network teach itself Tic-Tac-Toe in real time — no installation, no cloud, no API keys.*

---

## The Problem with Learning AI

If you've ever tried to understand how neural networks learn, you've probably run into the same wall I did:

1. **Theory is abstract.** You read about backpropagation, loss functions, and reinforcement learning — but it's all math on a page.
2. **Setup is painful.** Most ML tutorials require Python, Conda, CUDA, Jupyter notebooks, and a GPU that costs more than your rent.
3. **Training is invisible.** You run `model.fit()`, wait 3 hours, and get a number. What actually happened inside? No idea.

What if you could **see** a neural network learn? What if you could open a browser tab, hit "Train," and watch the network go from making completely random moves to playing perfect Tic-Tac-Toe in front of your eyes?

That's exactly what [Gato Neura](https://feojeda.github.io/gato-neura/) does.

---

## What Is Gato Neura?

**Gato Neura** is an interactive, browser-based tutorial that teaches you how neural networks and AI models are trained — by showing you the process in real time.

It's a self-contained implementation of the core ideas from DeepMind's [AlphaZero](https://deepmind.google/research/highlighted-research/alphazero/), scaled down to Tic-Tac-Toe so it runs entirely in your browser using TensorFlow.js.

**Live Demo:** [https://feojeda.github.io/gato-neura/](https://feojeda.github.io/gato-neura/)

**Source Code:** [https://github.com/feojeda/gato-neura](https://github.com/feojeda/gato-neura)

---

## Why Tic-Tac-Toe?

Tic-Tac-Toe is the perfect teaching environment:

- **Small enough** to run in a browser (9 inputs, ~3,000 parameters)
- **Complex enough** to require real learning (the network must discover strategy, not just memorize)
- **Visual enough** that you can *see* it improve (it starts by placing pieces randomly, then learns the center is powerful, then discovers forks and blocks)
- **Solved game** — so you know what "perfect" looks like and can measure progress

If a network can learn Tic-Tac-Toe from scratch, the same principles apply to Chess, Go, StarCraft, and beyond.

---

## What You'll See

### 1. Real-Time Training Metrics

As the network trains, you see live updates:

- **Games played** — how many self-play games the network has completed
- **Win rate** — percentage of games won during training
- **Policy Loss** — how well the network predicts *which* move to play
- **Value Loss** — how well the network evaluates if a position is winning
- **Quality vs Random** — the real test: after training, the network plays 100 greedy games against a random opponent

### 2. Neural Network Visualization

The actual network is drawn on screen. You can see:

- **Architecture** — input layer (9 neurons for the board), hidden layers (configurable), policy head (9 outputs for moves), value head (1 output for win probability)
- **Weights** — connections between neurons, color-coded from negative (red) to positive (green)
- **Heatmap** — when the network is "thinking," you see a probability distribution over the 9 board positions

### 3. The Training Journey

The network goes through distinct phases:

| Phase | What Happens |
|-------|-------------|
| **0–50 games** | Plays against a random opponent. Learns basic valid moves. |
| **50+ games** | **MCTS activates.** Before each move, the network simulates N games in its "mind" to find the best play. |
| **100+ games** | Opponent becomes an earlier version of the network itself. Self-play begins. |
| **With minimax** | Optional: mix in a perfect Tic-Tac-Toe solver as opponent. The network learns from the best. |

### 4. Download and Share Models

After training, you can **download the trained model as a JSON file** and share it. Others can load your model and continue training, or challenge it to a game.

---

## The Architecture (In Plain English)

The network has two "heads" — two separate outputs that learn different things:

### Policy Head: "What move should I play?"

Takes the board state → outputs 9 probabilities (one per cell).

```
Input:  [0, 0, 0, 0, 1, 0, 0, -1, 0]   # X in center, O in corner
Output: [0.05, 0.05, 0.05, 0.05, 0.60, 0.05, 0.05, 0.05, 0.05]
                                      # 60% confidence center is best
```

### Value Head: "Am I winning?"

Takes the board state → outputs a single number from -1 (losing) to +1 (winning).

```
Input:  [1, 1, 0, -1, 0, 0, 0, 0, 0]   # X can win next move
Output: 0.85                              # Network thinks it's winning
```

Both heads share the same hidden layers, so learning about "winning positions" (value) also improves "which move to play" (policy).

---

## How It Learns: Self-Play + MCTS

The network doesn't learn from a dataset. It learns from **experience**:

1. **Play a game** — The network plays against itself (or a random/minimax opponent)
2. **Record positions** — Every board state and the move chosen is saved
3. **MCTS improves targets** — Monte Carlo Tree Search runs 50+ simulations per move, refining which moves are actually good
4. **Train on experience** — The network is updated to better predict the MCTS-improved moves (policy) and the game outcome (value)
5. **Repeat** — The improved network plays better games, generating better training data

This is the same loop that made AlphaGo and AlphaZero world champions.

---

## No Installation. Seriously.

Open [the demo](https://feojeda.github.io/gato-neura/), click **Train**, and watch it learn.

That's it.

No `pip install`. No `conda env create`. No GPU drivers. No Jupyter notebook that crashes because you forgot to `tf.reset_default_graph()`.

It works on:
- Your laptop
- Your phone
- A library computer
- Your grandma's iPad

Because it runs entirely in the browser using TensorFlow.js.

---

## Who Is This For?

- **Students** learning how neural networks work — see the math come alive
- **Developers** curious about RL, MCTS, and self-play
- **Educators** who need a browser-based ML demo for a classroom
- **Beginners** who want to understand AlphaZero without reading a 40-page paper
- **Anyone** who wants to see an AI model train itself in real time

---

## Try It Yourself

1. Open **[the live demo](https://feojeda.github.io/gato-neura/)**
2. Click **Train** (start with 200–500 games)
3. Watch the metrics update in real time
4. After training, click a cell on the board to play against your trained network
5. Toggle the **Minimax opponent** and train again — see if the network can beat a perfect player

**Pro tip:** Open your browser's DevTools (F12) and you can read the exact JavaScript that runs. No compiled binaries, no hidden logic. ~2,000 lines of vanilla JS.

---

## What's Under the Hood?

- **TensorFlow.js 4.22** — for the neural network
- **Monte Carlo Tree Search** — for move selection and policy improvement
- **Minimax solver** — perfect Tic-Tac-Toe opponent with transposition table
- **Custom training loop** — no `model.fit()`, manual `optimizer.minimize()` for gradient clipping
- **Real-time visualization** — D3-like SVG rendering of the network architecture
- **Multilingual** — English, Español, 中文, 日本語
- **Zero build step** — open `index.html` and it works

---

## The Code

```javascript
// The entire training loop is ~100 lines
async function trainLoop(model, config, callbacks) {
    const { numGames, batchSize, lr, mctsSims } = config;
    const optimizer = tf.train.adam(lr);
    const replayBuffer = new ReplayBuffer(5000);
    
    for (let g = 0; g < numGames; g++) {
        // Self-play game with MCTS
        const examples = await playOneGame(model, mctsSims);
        replayBuffer.push(examples);
        
        // Train on past experience
        if (replayBuffer.length >= batchSize) {
            const batch = replayBuffer.sample(batchSize);
            await trainOnBatch(model, batch, optimizer);
        }
    }
}
```

Full source: [github.com/feojeda/gato-neura](https://github.com/feojeda/gato-neura)

---

## Why I Built This

I wanted to understand AlphaZero. I read the paper. I watched the lectures. But I still didn't *get* it.

So I built the smallest possible version — one I could run in a browser, watch in real time, and actually understand. Tic-Tac-Toe is trivial for a human, but surprisingly non-trivial for a neural network that starts from complete ignorance.

Watching the network go from "places pieces randomly" to "takes the center" to "creates forks" to "blocks your winning move" — that's the moment you *feel* how neural networks learn.

---

## What's Next?

Some ideas I'm exploring:

- **Connect Four** — same principles, larger state space
- **Model comparison** — pit two trained models against each other
- **Training replay** — rewind and replay the training process move by move
- **Export to ONNX** — run the trained model in other frameworks

Have ideas? [Open an issue](https://github.com/feojeda/gato-neura/issues) or [send a PR](https://github.com/feojeda/gato-neura/pulls).

---

## Learn More

- **Non-technical explanation:** [docs/EXPLAINED.md](https://github.com/feojeda/gato-neura/blob/main/docs/EXPLAINED.md)
- **Spanish version:** [README.es.md](https://github.com/feojeda/gato-neura/blob/main/README.es.md)
- **Chinese version:** [README.zh.md](https://github.com/feojeda/gato-neura/blob/main/README.zh.md)
- **Japanese version:** [README.ja.md](https://github.com/feojeda/gato-neura/blob/main/README.ja.md)

---

*Built with curiosity and coffee by [feojeda](https://github.com/feojeda). MIT License.*
