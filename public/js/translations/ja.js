/** @file ja.js — Japanese translations */

export default {
    app: {
        title: 'Gato Neura — 三目並べニューラルネットワーク',
        subtitle: 'AlphaZeroスタイルの三目並べニューラルネットワーク',
        howItWorks: 'これはどうやって動くの？'
    },
    panel: {
        model: 'モデル',
        board: '盤面',
        controls: 'コントロール'
    },
    model: {
        params: 'パラメータ: —',
        legend: {
            negative: '負',
            zero: 'ゼロ',
            positive: '正'
        },
        layer: '層 {n}',
        input: '入力',
        hidden: '隠れ層 {n}',
        policy: '方策',
        value: '価値'
    },
    board: {
        yourTurnX: 'あなたの番 (X)',
        yourTurnO: 'あなたの番 (O)',
        thinking: '考え中...',
        youWon: 'あなたの勝ち！',
        networkWon: 'ネットワークの勝ち',
        draw: '引き分け',
        confidence: '信頼度',
        starts: '先手:',
        playerStarts: 'プレイヤー (あなたはX)',
        networkStarts: 'ネットワーク (あなたはO)',
        playTemp: 'プレイ温度:',
        newGame: '新しいゲーム',
        resetAll: 'すべてリセット',
        resetModel: 'モデルをリセット',
        player: 'プレイヤー',
        draws: '引き分け',
        network: 'ネットワーク'
    },
    controls: {
        modelArch: 'モデルアーキテクチャ',
        addLayer: '+ 層',
        training: '学習',
        games: '対局数:',
        learningRate: '学習率:',
        batchSize: 'バッチサイズ:',
        mctsSims: 'MCTSシミュレーション数:',
        incremental: '増分学習（現在のモデルに追加）',
        train: '学習',
        stop: '停止',
        metrics: '指標',
        detecting: '検出中...',
        gpuActive: 'GPU (WebGL) 有効',
        cpuSlow: 'CPU (低速モード)',
        evaluatingQuality: '品質を評価中...'
    },
    metric: {
        games: '対局数:',
        winRate: '勝率:',
        policyLoss: '方策損失:',
        valueLoss: '価値損失:',
        quality: 'ランダム対戦品質:',
        chartWaiting: '学習データを待っています...',
        chartPolicy: '● 方策',
        chartValue: '● 価値',
        error: 'エラー'
    },
    status: {
        excellent: '優秀',
        good: '良好',
        fair: '普通',
        poor: '不良'
    },
    visualizer: {
        selectNode: 'ノードを選択',
        matrixTooLarge: '行列 {r}×{c} が大きすぎて可視化できません',
        weights: '重み: {name} ({r}×{c})'
    },
    modal: {
        metricTitle: '指標',
        mcts: {
            title: 'MCTSシミュレーション数',
            body: `<p><strong>とは:</strong> MCTS（モンテカルロ木探索）が学習中の各手番前に実行するシミュレーション回数。<strong>0</strong> = MCTSなし（速いが精度は低い）。</p>
            <h4>値の選び方:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">0 (無効)</span> — 高速学習。ネットワークは直接greedyでプレイ。最初の100〜200局に適している。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">10-20</span> — 速度と品質のバランス。軽量MCTSで手を改善し、それほど遅くならない。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">50</span> — AlphaZero標準。学習品質は格段に良いが、1局あたり約50倍遅い。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">100-200</span> — 非常に遅い。GPUと時間が十分にある場合のみ。50に比べて改善は限定的。</li>
            </ul>
            <p><strong>実用的なルール:</strong> <strong>0</strong>か<strong>20</strong>から始める。500局後もランダム対戦品質が改善しない場合は50に上げる。GPUがある場合は最初から50でもよい。</p>`
        },
        winrate: {
            title: '勝率',
            body: `<p><strong>とは:</strong> 学習中にネットワークが勝った対局の割合。</p>
            <h4>解釈の仕方:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">優秀 (>80%)</span> — ネットワークが現在の相手を圧倒している。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (60-80%)</span> — 順調に学習中、大部分に勝っている。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">普通 (40-60%)</span> — まだ支配的でない、より多くの学習が必要。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">不良 (<40%)</span> — 勝つより負けている。</li>
            </ul>
            <p><strong>注:</strong> 学習勝率は混合相手（ランダム＋スナップショット）に対するもの。真の品質指標は<strong>ランダム対戦品質</strong>である。</p>`
        },
        ploss: {
            title: '方策損失',
            body: `<p><strong>とは:</strong> 各局面で<em>どの手を指すべきか</em>をネットワークがどれだけ正確に予測できるかを測る。クロスエントロピー: 2.2 = 完全ランダム、低い方が良い。</p>
            <h4>解釈の仕方:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">優秀 (<1.0)</span> — ネットワークは正確にどの手を指すべきか知っている。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (1.0-1.5)</span> — 妥当な手を予測している。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">普通 (1.5-2.0)</span> — まだ混乱しており、時々ランダムな手を指す。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">不良 (>2.0)</span> — ほぼランダム。もっと学習が必要。</li>
            </ul>
            <p><strong>参考:</strong> 9マスの場合、完全ランダム = <code>-log(1/9) = 2.197</code>。損失が2.1なら、サイコロよりわずか5%良いだけ。</p>`
        },
        vloss: {
            title: '価値損失',
            body: `<p><strong>とは:</strong> 盤面が勝ち(+1)、負け(-1)、引き分け(0)のどれかをネットワークがどれだけ正確に評価できるかを測る。平均二乗誤差(MSE)。</p>
            <h4>解釈の仕方:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">優秀 (<0.3)</span> — ネットワークは最終結果をほぼ完璧に"見ている"。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (0.3-0.6)</span> — 局面評価が良好。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">普通 (0.6-1.0)</span> — 時々どちらが勝っているか混乱する。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">不良 (>1.0)</span> — 局面が良いか悪いかをよく理解していない。</li>
            </ul>
            <p><strong>重要:</strong> 低い価値損失は、ネットワークがうまくプレイすることを保証しない。評価はできても<em>何を指すべきか</em>わからない可能性がある（それは方策損失）。</p>`
        },
        quality: {
            title: 'ランダム対戦品質',
            body: `<p><strong>とは:</strong> 学習後、ネットワークはランダム相手に対して100局<em>greedy</em>（探索なし）でプレイする。これが真の実力試験である。</p>
            <h4>解釈の仕方:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">優秀 (>90%)</span> — 三目並べをほぼ完璧にプレイ。カジュアルな人間には負けない。</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">良好 (70-90%)</span> — 多くを知っているが、時々ミスをする。</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">普通 (50-70%)</span> — 基礎は知っているが、すべての戦術は知らない。</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">不良 (<50%)</span> — ランダムより悪い。より多くの学習かアーキテクチャの見直しが必要。</li>
            </ul>
            <p><strong>ヒント:</strong> MCTSで500局以上学習しても50%未満の場合、隠れ層を増やしてみる（例: [128, 64, 32]）。</p>`
        }
    },
    info: {
        title: 'Gato Neura はどうやって動くの？',
        whatIsMcts: 'MCTSとは？',
        mctsDesc: '<strong>MCTS</strong>（モンテカルロ木探索）は、着手前に可能な手の木を探索するアルゴリズムです。ネットワークがN手先を"考え"、異なるシナリオを試し、最も勝率が高い手を選ぶことを想像してください。',
        phasesTitle: '学習フェーズ',
        phase1: '<strong>フェーズ1 (0-50局):</strong> ネットワークはランダム相手と対局。基本的な手を学ぶ。',
        phase2: '<strong>フェーズ2 (50+局):</strong> <strong>MCTS</strong>が有効化。各手番前に、ネットワークは"頭の中"でN局シミュレートし、最良の手を見つける。<strong>MCTSシミュレーション数</strong>で調整可能。',
        phase3: '<strong>フェーズ3 (100+局):</strong> 相手はネットワーク自身の過去バージョンになる。ネットワークは自分自身と対局し、向上を強制される。',
        metricsTitle: '指標の解釈の仕方',
        metricsWinRate: '<strong>勝率:</strong> 累計勝利割合。良いモデルは >80% あるべき。',
        metricsPolicyLoss: '<strong>方策損失:</strong> ネットワークが正しい手を予測する能力。低い方が良い。',
        metricsValueLoss: '<strong>価値損失:</strong> ネットワークが局面が勝ちかどうかを評価する能力。低い方が良い。',
        metricsQuality: '<strong>ランダム対戦品質:</strong> 学習後、ネットワークはランダム相手に対して100局greedyでプレイ。<strong>>90% = 優秀, >70% = 良好, <50% = より多くの学習が必要。</strong>',
        heatmapTitle: '方策ヒートマップ',
        heatmapDesc: 'ネットワークが考えている時、各マスにパーセンテージが表示される。中央に80%と表示されていれば、ネットワークはそこが最善手であることを80%確信している。すべてのマスが~11%なら、ネットワークには何もわかっていない（まだ学習していない）。',
        tempTitle: 'プレイ温度',
        tempDesc: '<strong>0.0</strong> = ネットワークは常に最善手を指す（greedy）。<strong>1.0+</strong> = ネットワークはより創造的になり、時々予想外の手を試す。',
        gpuTitle: 'GPU vs CPU',
        gpuDesc1: '指標の上に<strong>"GPU (WebGL) 有効"</strong>または<strong>"CPU (低速モード)"</strong>と表示される。',
        gpuItem1: '<strong>GPU (WebGL):</strong> グラフィックカードを使用。学習は5-10倍速い。推奨。',
        gpuItem2: '<strong>CPU:</strong> プロセッサを使用。動作するが学習は遅い。ハードウェア加速のないブラウザやヘッドレスモードで発生する可能性がある。',
        gpuDesc2: '<strong>何もする必要はありません。</strong> TensorFlow.js は自動的にブラウザがWebGLを持っているか検出し、使用します。ほぼすべてのモダンブラウザはデフォルトで有効になっています。',
        whyLosesTitle: 'なぜネットワークは時々負けるの？',
        whyLosesDesc: '200局未満の学習では、ネットワークはまだ学習中。また、<strong>温度</strong>が高い場合、ネットワークは最善手を活用するのではなく探索する。'
    },
    tooltip: {
        details: '詳細を見る'
    },
    errors: {
        couldNotVerifyArch: 'モデルアーキテクチャを確認できませんでした。新しいモデルを作成します'
    }
};
