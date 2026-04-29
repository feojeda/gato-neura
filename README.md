# Gato Neura — Learn How Neural Networks & AI Models Are Trained

<p align="center">
  <img src="https://img.shields.io/badge/lang-en-blue" alt="English">
  <a href="README.es.md"><img src="https://img.shields.io/badge/lang-es-green" alt="Español"></a>
  <a href="README.zh.md"><img src="https://img.shields.io/badge/lang-zh-red" alt="中文"></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/lang-ja-orange" alt="日本語"></a>
</p>

> **An interactive tutorial to learn how neural networks and AI models are trained. Watch a neural network teach itself Tic-Tac-Toe in your browser — no backend, no cloud, no API keys.**

This project demonstrates **self-play reinforcement learning**, **Monte Carlo Tree Search (MCTS)**, and **dual-head neural networks** (policy + value) using TensorFlow.js. Everything runs locally in your browser. You can watch the network learn in real time, inspect its weights, visualize its decision-making, download trained models, and even read the exact source code that runs it.

**Live Demo:** [https://feojeda.github.io/gato-neura/](https://feojeda.github.io/gato-neura/)

**Non-technical explanation:** [docs/EXPLAINED.md](docs/EXPLAINED.md)

---

## Table of Contents

- [Who is this for?](#who-is-this-for)
- [What is this?](#what-is-this)
- [Quick Start](#quick-start)
- [How to Use](#how-to-use)
- [Understanding the Metrics](#understanding-the-metrics)
- [The Math Behind It](#the-math-behind-it)
- [Architecture](#architecture)
- [Training Phases](#training-phases)
- [Multilingual Support](#multilingual-support)
- [Contributing](#contributing)
- [License](#license)

---

## Who is this for?

- **Students** learning how neural networks work and how AI models are trained
- **Developers** curious about reinforcement learning, self-play, and MCTS
- **Educators** looking for a browser-based machine learning demo
- **Anyone** who wants to see an AI model train itself in real time and understand what happens under the hood
- **Beginners** who want a gentle introduction to AlphaZero-style algorithms without installing anything

---

## What is this?

Gato Neura is a **self-contained, educational implementation** of the core ideas from DeepMind's AlphaZero, scaled down to Tic-Tac-Toe so it runs entirely in a web browser.

It demonstrates:
- **Dual-head neural networks** (policy + value)
- **Self-play reinforcement learning**
- **Monte Carlo Tree Search (MCTS)** for move selection
- **Curriculum learning** (random opponent → perfect minimax → snapshot of itself)
- **Real-time visualization** of weights, architecture, and training metrics
- **Model save/load** — download and share trained models as JSON

All in ~2,000 lines of vanilla JavaScript with **zero build step**. Open DevTools and read the exact code that runs.

---

## Quick Start

```bash
# Clone
git clone https://github.com/feojeda/gato-neura.git
cd gato-neura

# Serve locally (any static server works)
python3 -m http.server 8080 --directory public
# or
npx serve public

# Open http://localhost:8080
```

No `npm install`. No bundler. No compilation.

---

## How to Use

The UI is divided into three panels:

### 1. Model Panel (left)
Shows a live SVG graph of the neural network architecture. Click any node to see a heatmap of its incoming weights.

### 2. Board Panel (center)
The game itself. Choose who starts, set the play temperature, and play against the trained network.

- **Play Temperature**: `0.0` = always best move (greedy). `>1.0` = creative, sometimes random.
- **Policy Hints**: During the network's turn, percentages appear on each empty cell showing the network's confidence.

### 3. Controls Panel (right)

#### Model Architecture
Add/remove hidden layers before training. Default: `[64, 32]`.

> **Tip:** For Tic-Tac-Toe, 2-3 layers of 32-64 neurons is plenty. More layers won't help and may slow convergence.

#### Training Settings

| Setting | Default | What it does |
|---------|---------|-------------|
| **Games** | 500 | Total self-play games to generate |
| **Learning Rate** | 0.0003 | Step size for gradient descent |
| **Batch Size** | 64 | Training examples per update |
| **MCTS Simulations** | 50 | Simulations per move (0 = disabled) |
| **Incremental** | off | Add to existing model or start fresh |

#### Training Button
Hit **Train** and watch the metrics update in real time. Training pauses the game UI.

---

## Understanding the Metrics

### Win Rate
Percentage of games the network won during the current training session.

| Badge | Meaning |
|-------|---------|
| 🟢 Excellent (>80%) | Dominates the current opponent |
| 🔵 Good (60-80%) | Winning majority, still learning |
| 🟡 Fair (40-60%) | Not dominant yet |
| 🔴 Poor (<40%) | Losing more than winning |

> Training win rate is against a **mixed opponent** (random + older snapshot). The real test is **Quality vs Random**.

### Policy Loss
How well the network predicts *which* move to play.

Lower is better. With 9 cells, pure random guessing has a baseline loss of:

$$\mathcal{L}_{\text{random}} = -\log\frac{1}{9} = 2.197$$

A loss of 2.1 means you're only ~5% better than a dice roll.

| Badge | Threshold |
|-------|-----------|
| 🟢 Excellent | < 1.0 |
| 🔵 Good | 1.0 - 1.5 |
| 🟡 Fair | 1.5 - 2.0 |
| 🔴 Poor | > 2.0 |

### Value Loss
How well the network evaluates whether a position is winning (+1), losing (-1), or drawn (0).

This is Mean Squared Error (MSE):

$$\mathcal{L}_V = \frac{1}{N}\sum_{i=1}^{N}(v_i^{\text{target}} - v_i^{\text{pred}})^2$$

| Badge | Threshold |
|-------|-----------|
| 🟢 Excellent | < 0.3 |
| 🔵 Good | 0.3 - 0.6 |
| 🟡 Fair | 0.6 - 1.0 |
| 🔴 Poor | > 1.0 |

> Low value loss ≠ good play. The network might evaluate well but not know *what* to move.

### Quality vs Random
After training, the network plays **100 greedy games** against a purely random opponent. This is the ground-truth metric.

| Result | Interpretation |
|--------|----------------|
| >90% | Near-perfect play. Beats any casual human. |
| 70-90% | Strong, occasional mistakes. |
| 50-70% | Knows basics, misses tactics. |
| <50% | Worse than random. Needs more training or bigger network. |

### Loss Chart
Real-time plot of policy loss (blue) and value loss (red) over the last 100 training batches.

---

## The Math Behind It

### Neural Network Architecture

The network is a **multi-layer perceptron** with two output heads:

$$
\mathbf{x} \in \mathbb{R}^9 \xrightarrow{\text{Dense}} \mathbf{h}_1 \xrightarrow{\text{ReLU}} \mathbf{h}_2 \xrightarrow{\text{ReLU}} \begin{cases} \mathbf{p} \in \mathbb{R}^9 & \text{(Policy)} \\ v \in \mathbb{R} & \text{(Value)} \end{cases}
$$

**Input encoding:**
- $+1$: network's piece
- $-1$: opponent's piece
- $0$: empty

**Perspective invariance:** The network always sees itself as $+1$. If playing as O, the board is inverted before feeding to the network.

### Policy Head

Outputs a probability distribution over the 9 cells using softmax:

$$p_i = \frac{e^{z_i}}{\sum_{j} e^{z_j}}$$

Illegal moves (occupied cells) are masked to probability 0, then the distribution is renormalized.

### Value Head

A single neuron with $\tanh$ activation, giving a scalar in $[-1, +1]$:

$$v = \tanh(w^T h + b)$$

### Policy Loss: Cross-Entropy

The network is trained to match a target policy $\pi$ (from MCTS visit counts):

$$\mathcal{L}_P = -\frac{1}{N}\sum_{i=1}^{N}\sum_{j=1}^{9} \pi_{ij} \log \hat{p}_{ij}$$

Clipped for numerical stability ($\varepsilon = 10^{-7}$):

$$\hat{p}_{ij} = \text{clip}(p_{ij}, \varepsilon, 1-\varepsilon)$$

### Value Loss: Mean Squared Error

$$\mathcal{L}_V = \frac{1}{N}\sum_{i=1}^{N}(z_i - v_i)^2$$

where $z_i \in \{-1, 0, +1\}$ is the game outcome from the current player's perspective.

### Total Loss

$$\mathcal{L} = \mathcal{L}_P + \mathcal{L}_V$$

### Temperature Sampling

During training, moves are sampled with temperature $T$ to balance exploration vs exploitation:

$$\tilde{p}_i = \frac{p_i^{1/T}}{\sum_j p_j^{1/T}}$$

- $T = 1.0$: sample from the raw policy (high exploration)
- $T \to 0$: always pick the highest probability (pure exploitation)
- In this implementation, $T$ decays linearly from 1.0 to 0.3 over training.

### Monte Carlo Tree Search (MCTS)

After ~50 games, MCTS activates. For each move, the network runs $N$ simulations:

1. **Selection**: Traverse the game tree using UCB1 score:

$$U(s, a) = Q(s, a) + c_{puct} \cdot P(a|s) \cdot \frac{\sqrt{N(s)}}{1 + N(s, a)}$$

2. **Expansion**: When reaching an unvisited node, expand it using the network's policy output.

3. **Evaluation**: Use the network's value estimate for leaf nodes.

4. **Backup**: Propagate the result back up the tree, flipping the sign at each level (zero-sum game).

5. **Move selection**: Play proportional to visit counts.

Each simulation requires one forward pass through the network, so 50 simulations ≈ 50× slower than greedy play.

### Gradient Clipping

To prevent exploding gradients, gradients are clipped to a maximum norm:

$$\mathbf{g} \leftarrow \frac{\mathbf{g}}{\max(1, \|\mathbf{g}\|_2 / g_{\max})}$$

In this implementation, $g_{\max} = 1.0$.

---

## Architecture

```
public/
├── index.html              # Main dashboard
├── css/styles.css          # Responsive layout
└── js/
    ├── app.js              # Orchestrator, game loop
    ├── game.js             # Pure game logic (immutable)
    ├── model.js            # TF.js model creation / inference
    ├── trainer.js          # Self-play + MCTS + training loop
    ├── ui.js               # DOM bindings, metrics, i18n
    ├── visualizer.js       # SVG graph rendering
    ├── i18n.js             # Lightweight i18n engine
    └── translations/       # en, es, zh, ja
        ├── en.js
        ├── es.js
        ├── zh.js
        └── ja.js
```

**Design philosophy:** Zero build step. What you see in DevTools is exactly what runs. No webpack, no npm, no transpilation.

---

## Training Phases

The training curriculum has three phases:

| Phase | Games | Opponent | MCTS | Purpose |
|-------|-------|----------|------|---------|
| 1 | 0-50 | Random | No | Learn basic winning patterns |
| 2 | 50-100 | Random + Snapshot | Yes | Learn tactics via tree search |
| 3 | 100+ | Snapshot (self) | Yes | Refine against past self |

A **snapshot** of the model is taken every 100 games. This older version becomes the opponent, forcing the current model to improve against a stronger foe.

---

## Multilingual Support

Gato Neura supports 4 languages out of the box:

- 🇺🇸 **English** (default)
- 🇪🇸 **Español**
- 🇨🇳 **中文 (Simplified Chinese)**
- 🇯🇵 **日本語 (Japanese)**

Switch languages via the dropdown in the header. Your preference is saved to `localStorage`.

---

## Contributing

This project is intentionally small and readable. Contributions are welcome!

### Ideas we'd love help with

- [ ] **Web Workers**: Move training off the main thread so the UI stays responsive
- [ ] **Save/Load models**: Export trained weights (JSON or localStorage)
- [ ] **Better visualization**: Policy heatmaps per position, activation maps
- [ ] **More games**: Connect Four, Checkers, or Hex using the same engine
- [ ] **Manual MCTS inspection**: Click "Think" and see the search tree
- [ ] **ELO estimation**: Track estimated rating over time
- [ ] **More languages**: Any language you speak
- [ ] **Tests**: More Playwright coverage for edge cases

### How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-idea`
3. Make your changes
4. Run tests: `node test-integration.mjs`
5. Open a Pull Request against `develop`

No CLA, no bureaucracy. If it improves the project, we'll merge it.

**Questions or ideas?** Open an [Issue](https://github.com/feojeda/gato-neura/issues) or start a [Discussion](https://github.com/feojeda/gato-neura/discussions).

---

## License

MIT © [Francisco Ojeda](https://github.com/feojeda)
