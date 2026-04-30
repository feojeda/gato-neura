/** @file zh.js — Simplified Chinese translations */

export default {
    app: {
        title: 'Gato Neura — 井字棋神经网络',
        subtitle: 'AlphaZero风格的井字棋神经网络',
        howItWorks: '这是如何运作的？',
        about: '关于'
    },
    panel: {
        model: '模型',
        board: '棋盘',
        controls: '控制',
        arena: '模型竞技场'
    },
    model: {
        params: '参数: —',
        legend: {
            negative: '负值',
            zero: '零',
            positive: '正值'
        },
        layer: '层 {n}',
        input: '输入',
        hidden: '隐藏层 {n}',
        policy: '策略',
        value: '价值'
    },
    board: {
        yourTurnX: '你的回合 (X)',
        yourTurnO: '你的回合 (O)',
        thinking: '思考中...',
        youWon: '你赢了！',
        networkWon: '网络赢了',
        draw: '平局',
        confidence: '置信度',
        starts: '先手:',
        playerStarts: '玩家 (你是X)',
        networkStarts: '网络 (你是O)',
        playTemp: '游戏温度:',
        newGame: '新游戏',
        resetAll: '全部重置',
        resetModel: '重置模型',
        downloadModel: '下载模型',
        loadModel: '加载模型',
        player: '玩家',
        draws: '平局',
        network: '网络',
        trainedGames: '训练局数'
    },
    controls: {
        modelArch: '模型架构',
        addLayer: '+ 层',
        training: '训练',
        games: '对局数:',
        learningRate: '学习率:',
        batchSize: '批量大小:',
        mctsSims: 'MCTS模拟次数:',
        incremental: '增量训练（添加到当前模型）',
        useMinimax: '使用完美对手（minimax）',
        train: '训练',
        stop: '停止',
        metrics: '指标',
        detecting: '检测中...',
        gpuActive: 'GPU (WebGL) 已激活',
        cpuSlow: 'CPU (慢速模式)',
        evaluatingQuality: '评估质量中...'
    },
    metric: {
        games: '对局数:',
        winRate: '胜率:',
        policyLoss: '策略损失:',
        valueLoss: '价值损失:',
        quality: '对战随机质量:',
        chartWaiting: '等待训练数据...',
        chartPolicy: '● 策略',
        chartValue: '● 价值',
        error: '错误'
    },
    status: {
        excellent: '优秀',
        good: '良好',
        fair: '一般',
        poor: '较差'
    },
    visualizer: {
        selectNode: '选择一个节点',
        matrixTooLarge: '矩阵 {r}×{c} 过大，无法可视化',
        weights: '权重: {name} ({r}×{c})'
    },
    modal: {
        metricTitle: '指标',
        mcts: {
            title: 'MCTS模拟次数',
            body: `<p><strong>是什么：</strong>MCTS（蒙特卡洛树搜索）在训练期间每次落子前运行的模拟次数。<strong>0</strong> = 不使用MCTS（快但精度低）。</p>
            <h4>如何选择数值：</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">0 (关闭)</span> — 快速训练。网络直接进行贪婪博弈。适合前100-200局。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">10-20</span> — 速度/质量平衡。轻量级MCTS改善走法而不会太慢。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">50</span> — AlphaZero标准。训练质量好得多，但每局约慢50倍。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">100-200</span> — 非常慢。只有拥有GPU和大量时间时才有用。相比50提升有限。</li>
            </ul>
            <p><strong>实用规则：</strong>从<strong>0</strong>或<strong>20</strong>开始。如果500局后对战随机质量没有提升，增加到50。有GPU可以直接从50开始。</p>`
        },
        winrate: {
            title: '胜率',
            body: `<p><strong>是什么：</strong>网络在训练期间赢得的对局百分比。</p>
            <h4>如何解读：</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">优秀 (>80%)</span> — 网络完全压制当前对手。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (60-80%)</span> — 学习良好，赢得大部分对局。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">一般 (40-60%)</span> — 尚未主导，需要更多训练。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">较差 (<40%)</span> — 输多赢少。</li>
            </ul>
            <p><strong>注意：</strong>训练胜率针对的是混合对手（随机+快照）。真正的质量指标是<strong>对战随机质量</strong>。</p>`
        },
        ploss: {
            title: '策略损失',
            body: `<p><strong>是什么：</strong>衡量网络在每个位置预测<em>哪个</em>走法的能力。交叉熵：2.2 = 纯随机，越低越好。</p>
            <h4>如何解读：</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">优秀 (<1.0)</span> — 网络完全知道该走哪步。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (1.0-1.5)</span> — 预测合理的走法。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">一般 (1.5-2.0)</span> — 仍然困惑，某些走法是随机的。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">较差 (>2.0)</span> — 几乎随机。需要大量额外训练。</li>
            </ul>
            <p><strong>参考：</strong>9个格子时，纯随机 = <code>-log(1/9) = 2.197</code>。如果损失是2.1，你只比骰子好5%。</p>`
        },
        vloss: {
            title: '价值损失',
            body: `<p><strong>是什么：</strong>衡量网络评估棋盘位置是赢(+1)、输(-1)还是平局(0)的能力。均方误差(MSE)。</p>
            <h4>如何解读：</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">优秀 (<0.3)</span> — 网络几乎完美地"看到"最终结果。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (0.3-0.6)</span> — 位置评估良好。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">一般 (0.6-1.0)</span> — 有时对谁会赢感到困惑。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">较差 (>1.0)</span> — 不太理解位置是好是坏。</li>
            </ul>
            <p><strong>重要：</strong>低价值损失不能保证网络下得好。它可能评估很好但不知道<em>该走什么</em>（那是策略损失）。</p>`
        },
        quality: {
            title: '对战随机质量',
            body: `<p><strong>是什么：</strong>训练结束后，网络进行100局<em>贪婪</em>（无探索）对局对抗随机对手。这是真正的试金石。</p>
            <h4>如何解读：</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">优秀 (>90%)</span> — 井字棋下得几乎完美。能击败任何 casual 玩家。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (70-90%)</span> — 懂得很多，但偶尔还会犯错。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">一般 (50-70%)</span> — 懂得基础但不是所有战术。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">较差 (<50%)</span> — 比随机还差。需要更多训练或检查架构。</li>
            </ul>
            <p><strong>提示：</strong>如果用MCTS训练了500+局仍低于50%，尝试增加隐藏层（例如 [128, 64, 32]）。</p>`
        }
    },
    info: {
        title: 'Gato Neura 是如何运作的？',
        whatIsMcts: '什么是MCTS？',
        mctsDesc: '<strong>MCTS</strong>（蒙特卡洛树搜索）是一种在下棋前探索可能走法树的算法。想象网络在"思考"N步之后的走法，尝试不同场景，并选择胜率最高的。',
        phasesTitle: '训练阶段',
        phase1: '<strong>阶段1 (0-50局):</strong> 网络与随机对手对弈。学习基本走法。',
        phase2: '<strong>阶段2 (50+局):</strong> 激活<strong>MCTS</strong>。每次落子前，网络在"脑海中"模拟N局来找到最佳走法。你可以在<strong>MCTS模拟次数</strong>中调整数量。',
        phase3: '<strong>阶段3 (100+局):</strong> 对手变成网络自身的早期版本。网络与自己对弈，迫使自己进步。',
        metricsTitle: '如何解读指标',
        metricsWinRate: '<strong>胜率:</strong> 累计获胜百分比。好的模型应该 >80%。',
        metricsPolicyLoss: '<strong>策略损失:</strong> 网络预测正确走法的能力。越低越好。',
        metricsValueLoss: '<strong>价值损失:</strong> 网络评估位置是否获胜的能力。越低越好。',
        metricsQuality: '<strong>对战随机质量:</strong> 训练后，网络进行100局贪婪对局对抗随机对手。<strong>>90% = 优秀模型, >70% = 良好, <50% = 需要更多训练。</strong>',
        heatmapTitle: '策略热力图',
        heatmapDesc: '网络思考时，你会在每个格子看到百分比。中心显示80%意味着网络有80%的把握认为走那里最好。如果所有格子都显示~11%，网络完全没有概念（还没学会）。',
        tempTitle: '游戏温度',
        tempDesc: '<strong>0.0</strong> = 网络总是走最佳走法（贪婪）。<strong>1.0+</strong> = 网络变得更有创意，有时会尝试意外走法。',
        gpuTitle: 'GPU vs CPU',
        gpuDesc1: '指标上方显示<strong>"GPU (WebGL) 已激活"</strong>或<strong>"CPU (慢速模式)"</strong>。',
        gpuItem1: '<strong>GPU (WebGL):</strong> 使用显卡。训练速度快5-10倍。推荐。',
        gpuItem2: '<strong>CPU:</strong> 使用处理器。能运行但训练慢。可能出现在没有硬件加速的浏览器或headless模式中。',
        gpuDesc2: '<strong>你不需要做任何事。</strong> TensorFlow.js 自动检测浏览器是否有WebGL并使用。几乎所有现代浏览器都默认启用。',
        whyLosesTitle: '为什么网络有时会输？',
        whyLosesDesc: '训练少于200局时，网络还在学习中。另外，如果<strong>温度</strong>很高，网络会探索而不是利用它的最佳走法。'
    },
    about: {
        title: '关于 Gato Neura',
        body: `<p><strong>Gato Neura</strong> 是一个开源教育项目，直接在浏览器中教你 AlphaZero 风格的强化学习是如何工作的。无需服务器，无需云端 — 一切均使用 TensorFlow.js 在本地运行。</p>
        <p>神经网络通过与自身和完美的极小极大对手进行数千场对局来学习井字棋，由蒙特卡洛树搜索（MCTS）引导。你可以实时观看它学习，检查其内部权重，甚至下载训练好的模型以分享或稍后继续训练。</p>
        <p>由 <a href="https://github.com/feojeda" target="_blank" rel="noopener">feojeda</a> 用好奇心和咖啡构建。</p>
        <p><a href="https://github.com/feojeda/gato-neura" target="_blank" rel="noopener" class="github-link">在 GitHub 上查看源代码 →</a></p>`
    },
    arena: {
        mode: '模式:',
        currentVsRandom: '当前模型 vs 随机',
        uploadVsRandom: '上传模型 vs 随机',
        uploadVsCurrent: '上传模型 vs 当前',
        uploadVsUpload: '上传模型 A vs 上传模型 B',
        modelA: '模型 A',
        modelB: '模型 B',
        games: '局数:',
        start: '开始对战',
        results: '结果',
        winsA: 'A 胜:',
        draws: '平局:',
        winsB: 'B 胜:',
        winRateA: 'A 胜率:',
        ready: '就绪',
        battleInProgress: '对战中...'
    },
    tooltip: {
        details: '点击查看详情'
    },
    errors: {
        couldNotVerifyArch: '无法验证模型架构，将创建新模型',
        cannotLoadWhileTraining: '训练进行中时无法加载模型。请先停止训练。'
    }
};
