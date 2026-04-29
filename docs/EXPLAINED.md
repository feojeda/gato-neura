# How Neural Networks Learn: A Visual Guide to AI Training

> *You don't need a math degree to understand how a neural network learns to play Tic-Tac-Toe. This guide explains how AI models are trained, what happens during learning, and why self-play makes machines smarter — using plain language and analogies.*

---

## What is this thing?

**Gato Neura** is a small computer program that teaches itself to play Tic-Tac-Toe by playing thousands of games against itself. It runs entirely in your web browser — no cloud, no servers, no accounts.

Think of it like a child learning a board game:
- At first, the child moves completely randomly.
- After losing a few times, they start noticing patterns: "If I put my piece in the center, I win more often."
- Eventually, they become unbeatable.

That's exactly what this program does. Except instead of a child, it's a **tiny brain made of math** — a neural network with just a few hundred "neurons."

---

## The "Brain" — Explained with an Analogy

Imagine you're trying to predict whether it will rain tomorrow. You look at several clues:
- Is it cloudy? (+1 if yes, -1 if no)
- Is the humidity high? (+1 / -1)
- Is there wind? (+1 / -1)

You combine these clues in your head, weighting some more than others, and come up with a gut feeling: "70% chance of rain."

A neural network does **exactly the same thing**, but with numbers:
- It receives 9 inputs (the 9 cells of the board)
- Each input is +1 (my piece), -1 (opponent's piece), or 0 (empty)
- It passes these through layers of "neurons" that weigh and combine the information
- At the end, it outputs two things:
  1. **"Where should I play?"** (a probability for each cell)
  2. **"Am I winning or losing?"** (a score from -1 to +1)

The magic is that the network **starts completely clueless**. It learns by trial and error, adjusting those weights every time it wins or loses.

---

## How Does It Learn?

### Phase 1: Learning from a Drunk Opponent

For the first 50 games, the network plays against someone who moves completely at random — like a drunk person pressing buttons.

This is actually useful! The drunk opponent makes terrible mistakes, so the network quickly learns basic winning patterns:
- "If I have two in a row and the third is empty, I should play there to win."
- "If my opponent has two in a row, I must block or I lose."

### Phase 2: Thinking Ahead with MCTS

After 50 games, the network activates **MCTS** (Monte Carlo Tree Search). Think of it as the network "daydreaming" about possible futures.

Before making a move, the network imagines: *"What if I play here? What might my opponent do? What would I do next?"* It plays out dozens of imaginary games in its head and picks the move that leads to the most wins.

It's like a chess player thinking several moves ahead — except this network only needs to think 2-3 moves ahead because Tic-Tac-Toe is a very small game.

### Phase 3: Playing Against Its Younger Self

After 100 games, the network starts playing against an **older version of itself** — like a chess grandmaster reviewing their games from six months ago.

Why? Because beating a random opponent is easy. Beating yourself from last week is hard. This forces the network to keep improving.

---

## What Do the Numbers Mean?

When you train the network, you'll see four metrics. Here's what they mean in plain English:

### Win Rate
"Out of 100 games, how many did the network win?"

- **Above 80%** — The network is crushing its current opponent.
- **40-60%** — It's roughly even. Needs more practice.
- **Below 40%** — It's losing more than winning. Something is wrong (maybe the learning rate is too high).

> **Important:** This win rate is against a mixed opponent (sometimes random, sometimes an older version of itself). The **real** test is "Quality vs Random."

### Policy Loss
"How good is the network at predicting the right move?"

Think of it like a multiple-choice test with 9 options. A score of **2.2** means the network is guessing randomly (like picking answers with a coin flip). A score of **1.5** means it's getting some right. Below **1.0** means it usually knows the best move.

### Value Loss
"How good is the network at judging whether a position is winning or losing?"

This is like asking someone to predict the weather. If they say "70% chance of rain" and it rains, they were right. If they say "sunny" and it pours, they were wrong.

The network tries to predict: "If the game ended right now, would I win (+1), lose (-1), or draw (0)?" The closer its predictions are to reality, the lower this number.

> **Note:** A network can be great at judging positions but still play poorly. It's like someone who can analyze a chess game perfectly but forgets to protect their queen.

### Quality vs Random
"If the network plays seriously (no random moves), how often does it beat a monkey pressing buttons?"

This is the **most honest metric**. After training, the network plays 100 games against a purely random opponent with zero creativity.

- **Above 90%** — Nearly perfect play. Would beat any casual human.
- **50-70%** — Knows the basics but makes tactical mistakes.
- **Below 50%** — Worse than a monkey. Needs way more training.

---

## Why Is Training Sometimes Slow?

The slowest part is **MCTS**. Every time the network makes a move, it runs 50 simulations — each one requiring the network to "think" about a possible future.

Imagine reading 50 different versions of tomorrow's newspaper before deciding what to wear. That's MCTS.

You can speed it up by:
- Setting MCTS simulations to **0** (no thinking ahead — faster but less accurate)
- Setting MCTS to **10-20** (light thinking — good balance)
- Using a computer with **GPU** (graphics card) instead of CPU

---

## Why Does the Network Sometimes Lose?

Three reasons:

1. **Not enough training.** With fewer than 200 games, it's still a beginner. Think of it like a kid who has only played 5 games of chess.

2. **High temperature.** If the "play temperature" slider is above 0, the network sometimes makes random moves on purpose — to explore new strategies. Set it to 0 if you want it to play its absolute best.

3. **Tic-Tac-Toe is a solved game.** With perfect play, every game ends in a draw. The network can only win if the human (or random opponent) makes a mistake. Against a perfect player, the best it can do is draw.

---

## Tips for Getting the Best Results

1. **Start with 500 games, MCTS = 0.** Let it learn the basics quickly.
2. **Then train 500 more with MCTS = 50.** Now it learns to think ahead.
3. **Check "Quality vs Random" after each session.** That's your real score.
4. **If quality is stuck below 50% after 1000+ games**, try adding a layer (e.g., `[128, 64, 32]`).
5. **Play with temperature = 0** if you want to see its best play.

---

## Can I Break It?

Absolutely. This is a tiny network with a few thousand parameters. Real AlphaZero used millions of parameters and ran on supercomputers. This is the "toy version" — designed to fit in a browser and be understandable.

Things that will break or confuse it:
- Training with a crazy-high learning rate (it will panic and output nonsense)
- Training for only 10 games (it won't learn anything)
- A single hidden layer with 2 neurons (too small to remember anything)

But that's part of the fun! Experiment and see what happens.

---

## Want to Learn More?

- **Technical deep dive:** [README.md](../README.md)
- **Watch AlphaZero beat chess:** Search "AlphaZero vs Stockfish" on YouTube
- **Read the code:** Open DevTools (F12) → Sources → `js/trainer.js`. It's heavily commented.

---

*Gato Neura was built to show that AI isn't magic — it's just pattern recognition, trial and error, and a lot of patience.*
