/** @file en.js — English (default) translations */

export default {
    app: {
        title: 'Gato Neura — Neural Network for Tic-Tac-Toe',
        subtitle: 'AlphaZero-style neural network for Tic-Tac-Toe',
        howItWorks: 'How does this work?'
    },
    panel: {
        model: 'Model',
        board: 'Board',
        controls: 'Controls'
    },
    model: {
        params: 'Parameters: —',
        legend: {
            negative: 'Negative',
            zero: 'Zero',
            positive: 'Positive'
        },
        layer: 'Layer {n}',
        input: 'Input',
        hidden: 'Hidden {n}',
        policy: 'Policy',
        value: 'Value'
    },
    board: {
        yourTurnX: 'Your turn (X)',
        yourTurnO: 'Your turn (O)',
        thinking: 'Thinking...',
        youWon: 'You won!',
        networkWon: 'Network won!',
        draw: 'Draw',
        confidence: 'Confidence',
        starts: 'Starts:',
        playerStarts: 'Player (you are X)',
        networkStarts: 'Network (you are O)',
        playTemp: 'Play temperature:',
        newGame: 'New Game',
        resetAll: 'Reset All',
        resetModel: 'Reset Model',
        downloadModel: 'Download Model',
        loadModel: 'Load Model',
        player: 'Player',
        draws: 'Draws',
        network: 'Network',
        trainedGames: 'Trained games'
    },
    controls: {
        modelArch: 'Model Architecture',
        addLayer: '+ Layer',
        training: 'Training',
        games: 'Games:',
        learningRate: 'Learning Rate:',
        batchSize: 'Batch Size:',
        mctsSims: 'MCTS Simulations:',
        incremental: 'Incremental training (add to current model)',
        useMinimax: 'Use perfect opponent (minimax)',
        train: 'Train',
        stop: 'Stop',
        metrics: 'Metrics',
        detecting: 'Detecting...',
        gpuActive: 'GPU (WebGL) active',
        cpuSlow: 'CPU (slow mode)',
        evaluatingQuality: 'Evaluating quality...'
    },
    metric: {
        games: 'Games:',
        winRate: 'Win Rate:',
        policyLoss: 'Policy Loss:',
        valueLoss: 'Value Loss:',
        quality: 'Quality vs Random:',
        chartWaiting: 'Waiting for training data...',
        chartPolicy: '● Policy',
        chartValue: '● Value',
        error: 'Error'
    },
    status: {
        excellent: 'Excellent',
        good: 'Good',
        fair: 'Fair',
        poor: 'Poor'
    },
    visualizer: {
        selectNode: 'Select a node',
        matrixTooLarge: 'Matrix {r}×{c} too large to visualize',
        weights: 'Weights: {name} ({r}×{c})'
    },
    modal: {
        metricTitle: 'Metric',
        mcts: {
            title: 'MCTS Simulations',
            body: `<p><strong>What it is:</strong> Number of simulations MCTS (Monte Carlo Tree Search) runs before each move during training. <strong>0</strong> = no MCTS (fast but less accurate).</p>
            <h4>How to choose the value:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">0 (disabled)</span> — Fast training. Network plays direct greedy. Good for the first 100-200 games.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">10-20</span> — Speed/quality balance. Light MCTS that improves moves without slowing down too much.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">50</span> — Standard AlphaZero. Much better training quality, but ~50x slower per game.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">100-200</span> — Very slow. Only useful if you have GPU and plenty of time. Marginal improvement over 50.</li>
            </ul>
            <p><strong>Practical rule:</strong> Start with <strong>0</strong> or <strong>20</strong>. If quality vs random doesn't improve after 500 games, bump to 50. With GPU you can leave 50 from the start.</p>`
        },
        winrate: {
            title: 'Win Rate',
            body: `<p><strong>What it is:</strong> Percentage of games won by the network during training.</p>
            <h4>How to interpret it:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excellent (>80%)</span> — The network dominates its current opponent.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Good (60-80%)</span> — Learning well, wins most games.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Fair (40-60%)</span> — Not dominant yet, needs more training.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Poor (<40%)</span> — Losing more than winning.</li>
            </ul>
            <p><strong>Note:</strong> Training win rate is against a mixed opponent (random + snapshot). The real quality metric is <strong>Quality vs Random</strong>.</p>`
        },
        ploss: {
            title: 'Policy Loss',
            body: `<p><strong>What it is:</strong> Measures how well the network predicts <em>which</em> move to play in each position. It's cross-entropy: a value of 2.2 = pure random, lower = better.</p>
            <h4>How to interpret it:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excellent (<1.0)</span> — The network knows exactly which move to make.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Good (1.0-1.5)</span> — Predicts reasonable moves.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Fair (1.5-2.0)</span> — Still confused, some moves are random.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Poor (>2.0)</span> — Almost random. Needs much more training.</li>
            </ul>
            <p><strong>Reference:</strong> With 9 cells, pure random = <code>-log(1/9) = 2.197</code>. If your loss is 2.1, you're only 5% better than a die.</p>`
        },
        vloss: {
            title: 'Value Loss',
            body: `<p><strong>What it is:</strong> Measures how well the network evaluates whether a board position is winning (+1), losing (-1), or a draw (0). It's mean squared error (MSE).</p>
            <h4>How to interpret it:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excellent (<0.3)</span> — The network "sees" the final outcome almost perfectly.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Good (0.3-0.6)</span> — Good position evaluation.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Fair (0.6-1.0)</span> — Sometimes confused about who's winning.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Poor (>1.0)</span> — Doesn't understand if a position is good or bad.</li>
            </ul>
            <p><strong>Important:</strong> Low value loss doesn't guarantee good play. The network might evaluate well but not know <em>what</em> to move (that's Policy Loss).</p>`
        },
        quality: {
            title: 'Quality vs Random',
            body: `<p><strong>What it is:</strong> After training, the network plays 100 games <em>greedy</em> (no exploration) against a random opponent. This is the real fire test.</p>
            <h4>How to interpret it:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excellent (>90%)</span> — Plays TTT almost perfectly. Would beat any casual human.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Good (70-90%)</span> — Knows a lot, but still makes occasional mistakes.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Fair (50-70%)</span> — Knows the basics but not all tactics.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Poor (<50%)</span> — Plays worse than random. Needs more training or architecture review.</li>
            </ul>
            <p><strong>Tip:</strong> If you trained 500+ games with MCTS and are still <50%, try increasing hidden layers (e.g. [128, 64, 32]).</p>`
        }
    },
    info: {
        title: 'How does Gato Neura work?',
        whatIsMcts: 'What is MCTS?',
        mctsDesc: '<strong>MCTS</strong> (Monte Carlo Tree Search) is an algorithm that explores the tree of possible moves before acting. Imagine the network "thinks" N moves ahead, trying different scenarios, and picks the one with the best chance of winning.',
        phasesTitle: 'Training Phases',
        phase1: '<strong>Phase 1 (0-50 games):</strong> The network plays against a random opponent. Learns basic moves.',
        phase2: '<strong>Phase 2 (50+ games):</strong> <strong>MCTS</strong> activates. Before each move, the network simulates N games in its "mind" to find the best play. You can adjust how many simulations in <strong>MCTS Simulations</strong>.',
        phase3: '<strong>Phase 3 (100+ games):</strong> The opponent becomes an earlier version of the network itself. The network plays against itself, forcing it to improve.',
        metricsTitle: 'How to interpret the metrics',
        metricsWinRate: '<strong>Win Rate:</strong> Cumulative win percentage. A good model should have >80%.',
        metricsPolicyLoss: '<strong>Policy Loss:</strong> How well the network predicts the correct moves. Lower = better.',
        metricsValueLoss: '<strong>Value Loss:</strong> How well the network evaluates if a position is winning. Lower = better.',
        metricsQuality: '<strong>Quality vs Random:</strong> After training, the network plays 100 greedy games vs random. <strong>>90% = excellent model, >70% = good, <50% = needs more training.</strong>',
        heatmapTitle: 'Policy heatmap',
        heatmapDesc: 'When the network is thinking, you see percentages in each cell. An 80% in the center means the network is 80% sure playing there is best. If all cells show ~11%, the network has no idea (hasn\'t learned yet).',
        tempTitle: 'Play temperature',
        tempDesc: '<strong>0.0</strong> = the network always plays its best move (greedy). <strong>1.0+</strong> = the network becomes more creative and sometimes tries unexpected things.',
        gpuTitle: 'GPU vs CPU',
        gpuDesc1: 'Above the metrics you see <strong>"GPU (WebGL) active"</strong> or <strong>"CPU (slow mode)"</strong>.',
        gpuItem1: '<strong>GPU (WebGL):</strong> Uses your graphics card. Training is 5-10x faster. Recommended.',
        gpuItem2: '<strong>CPU:</strong> Uses the processor. Works but training is slow. May happen in browsers without hardware acceleration or in headless mode.',
        gpuDesc2: '<strong>You don\'t have to do anything.</strong> TensorFlow.js automatically detects if your browser has WebGL and uses it. Almost all modern browsers have it enabled by default.',
        whyLosesTitle: 'Why does the network sometimes lose?',
        whyLosesDesc: 'With fewer than 200 training games, the network is still learning. Also, if <strong>temperature</strong> is high, the network explores instead of exploiting its best moves.'
    },
    tooltip: {
        details: 'Click for details'
    },
    errors: {
        couldNotVerifyArch: 'Could not verify model architecture, a new one will be created',
        cannotLoadWhileTraining: 'Cannot load a model while training is in progress. Please stop training first.'
    }
};
