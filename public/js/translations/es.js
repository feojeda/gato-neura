/** @file es.js — Spanish translations */

export default {
    app: {
        title: 'Gato Neura — Red Neuronal para Tic-Tac-Toe',
        subtitle: 'Red neuronal estilo AlphaZero para Tic-Tac-Toe',
        howItWorks: '¿Cómo funciona esto?',
        about: 'Acerca de'
    },
    panel: {
        model: 'Modelo',
        board: 'Tablero',
        controls: 'Controles',
        arena: 'Arena de Modelos'
    },
    model: {
        params: 'Parámetros: —',
        legend: {
            negative: 'Negativo',
            zero: 'Cero',
            positive: 'Positivo'
        },
        layer: 'Capa {n}',
        input: 'Entrada',
        hidden: 'Oculta {n}',
        policy: 'Policy',
        value: 'Value'
    },
    board: {
        yourTurnX: 'Tu turno (X)',
        yourTurnO: 'Tu turno (O)',
        thinking: 'Pensando...',
        youWon: '¡Ganaste!',
        networkWon: 'Ganó la Red',
        draw: 'Empate',
        confidence: 'Confianza',
        starts: 'Empieza:',
        playerStarts: 'Jugador (tú eres X)',
        networkStarts: 'Red (tú eres O)',
        playTemp: 'Temperatura de juego:',
        newGame: 'Nueva Partida',
        resetAll: 'Reiniciar Todo',
        resetModel: 'Reset Modelo',
        downloadModel: 'Descargar Modelo',
        loadModel: 'Cargar Modelo',
        player: 'Jugador',
        draws: 'Empates',
        network: 'Red',
        trainedGames: 'Partidas entrenadas'
    },
    controls: {
        modelArch: 'Arquitectura del Modelo',
        addLayer: '+ Capa',
        training: 'Entrenamiento',
        games: 'Partidas:',
        learningRate: 'Learning Rate:',
        batchSize: 'Batch Size:',
        mctsSims: 'Simulaciones MCTS:',
        incremental: 'Entrenamiento incremental (sumar al modelo actual)',
        useMinimax: 'Usar oponente perfecto (minimax)',
        train: 'Entrenar',
        stop: 'Detener',
        metrics: 'Métricas',
        detecting: 'Detectando...',
        gpuActive: 'GPU (WebGL) activa',
        cpuSlow: 'CPU (modo lento)',
        evaluatingQuality: 'Evaluando calidad...'
    },
    metric: {
        games: 'Partidas:',
        winRate: 'Win Rate:',
        policyLoss: 'Policy Loss:',
        valueLoss: 'Value Loss:',
        quality: 'Calidad vs Random:',
        chartWaiting: 'Esperando datos de entrenamiento...',
        chartPolicy: '● Policy',
        chartValue: '● Value',
        error: 'Error'
    },
    status: {
        excellent: 'Excelente',
        good: 'Bueno',
        fair: 'Regular',
        poor: 'Malo'
    },
    visualizer: {
        selectNode: 'Selecciona un nodo',
        matrixTooLarge: 'Matriz {r}×{c} muy grande para visualizar',
        weights: 'Pesos: {name} ({r}×{c})'
    },
    modal: {
        metricTitle: 'Métrica',
        mcts: {
            title: 'Simulaciones MCTS',
            body: `<p><strong>Qué es:</strong> Número de simulaciones que MCTS (Monte Carlo Tree Search) ejecuta antes de cada movimiento durante el entrenamiento. <strong>0</strong> = sin MCTS (rápido pero menos preciso).</p>
            <h4>Cómo elegir el valor:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">0 (desactivado)</span> — Entrenamiento rápido. La red juega greedy directo. Bueno para las primeras 100-200 partidas.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">10-20</span> — Balance velocidad/calidad. MCTS ligero que mejora las jugadas sin ralentizar demasiado.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">50</span> — Estándar AlphaZero. Mucho mejor calidad de entrenamiento, pero ~50x más lento por partida.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">100-200</span> — Muy lento. Solo útil si tienes GPU y mucho tiempo. Mejora marginal sobre 50.</li>
            </ul>
            <p><strong>Regla práctica:</strong> Empieza con <strong>0</strong> o <strong>20</strong>. Si la calidad vs random no mejora tras 500 partidas, sube a 50. Con GPU puedes dejar 50 desde el inicio.</p>`
        },
        winrate: {
            title: 'Win Rate (Tasa de Victorias)',
            body: `<p><strong>Qué es:</strong> Porcentaje de partidas ganadas por la red durante el entrenamiento.</p>
            <h4>Cómo interpretarlo:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excelente (>80%)</span> — La red domina a su oponente actual.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Bueno (60-80%)</span> — Aprendiendo bien, gana la mayoría.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Regular (40-60%)</span> — Aún no domina, necesita más entrenamiento.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Malo (<40%)</span> — Está perdiendo más de lo que gana.</li>
            </ul>
            <p><strong>Nota:</strong> El win rate del entrenamiento es contra un oponente mixto (random + snapshot). La métrica real de calidad es <strong>Calidad vs Random</strong>.</p>`
        },
        ploss: {
            title: 'Policy Loss (Pérdida de Política)',
            body: `<p><strong>Qué es:</strong> Mide qué tan bien la red predice <em>cuál</em> movimiento jugar en cada posición. Es cross-entropy: un valor de 2.2 = azar puro, menor = mejor.</p>
            <h4>Cómo interpretarlo:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excelente (<1.0)</span> — La red sabe exactamente qué jugada hacer.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Bueno (1.0-1.5)</span> — Predice movimientos razonables.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Regular (1.5-2.0)</span> — Aún confundida, algunas jugadas son al azar.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Malo (>2.0)</span> — Casi azar. Necesita mucho más entrenamiento.</li>
            </ul>
            <p><strong>Referencia:</strong> Con 9 casillas, azar puro = <code>-log(1/9) = 2.197</code>. Si tu loss es 2.1, solo estás 5% mejor que un dado.</p>`
        },
        vloss: {
            title: 'Value Loss (Pérdida de Valor)',
            body: `<p><strong>Qué es:</strong> Mide qué tan bien la red evalúa si una posición del tablero es ganadora (+1), perdedora (-1) o empate (0). Es error cuadrático medio (MSE).</p>
            <h4>Cómo interpretarlo:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excelente (<0.3)</span> — La red "ve" el resultado final casi perfectamente.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Bueno (0.3-0.6)</span> — Buena evaluación de posiciones.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Regular (0.6-1.0)</span> — A veces se confunde sobre quién va ganando.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Malo (>1.0)</span> — No entiende bien si una posición es buena o mala.</li>
            </ul>
            <p><strong>Importante:</strong> Value loss bajo no garantiza que la red juegue bien. Puede evaluar bien pero no saber <em>qué</em> mover (eso es Policy Loss).</p>`
        },
        quality: {
            title: 'Calidad vs Random',
            body: `<p><strong>Qué es:</strong> Después de entrenar, la red juega 100 partidas <em>greedy</em> (sin exploración) contra un oponente que elige al azar. Es la prueba de fuego real.</p>
            <h4>Cómo interpretarlo:</h4>
            <ul>
                <li><span class="status-excellent" style="padding:2px 6px;border-radius:4px;">Excelente (>90%)</span> — Juega TTT casi perfecto. Ganaría a cualquier humano casual.</li>
                <li><span class="status-good" style="padding:2px 6px;border-radius:4px;">Bueno (70-90%)</span> — Sabe mucho, pero aún comete errores ocasionales.</li>
                <li><span class="status-meh" style="padding:2px 6px;border-radius:4px;">Regular (50-70%)</span> — Conoce lo básico pero no todas las tácticas.</li>
                <li><span class="status-bad" style="padding:2px 6px;border-radius:4px;">Malo (<50%)</span> — Juega peor que el azar. Necesita más entrenamiento o revisar la arquitectura.</li>
            </ul>
            <p><strong>Tip:</strong> Si entrenaste 500+ partidas con MCTS y sigues en <50%, prueba aumentar las capas ocultas (ej: [128, 64, 32]).</p>`
        }
    },
    info: {
        title: '¿Cómo funciona Gato Neura?',
        whatIsMcts: '¿Qué es MCTS?',
        mctsDesc: '<strong>MCTS</strong> (Monte Carlo Tree Search) es un algoritmo que explora el árbol de posibles jugadas antes de mover. Imagina que la red "piensa" N movimientos adelante, probando diferentes escenarios, y elige el que tiene mejor probabilidad de ganar.',
        phasesTitle: 'Fases del entrenamiento',
        phase1: '<strong>Fase 1 (0-50 partidas):</strong> La red juega contra un oponente aleatorio. Aprende movimientos básicos.',
        phase2: '<strong>Fase 2 (50+ partidas):</strong> Se activa <strong>MCTS</strong>. Antes de cada movimiento, la red simula N partidas en su "mente" para encontrar la mejor jugada. Puedes ajustar cuántas simulaciones en <strong>Simulaciones MCTS</strong>.',
        phase3: '<strong>Fase 3 (100+ partidas):</strong> El oponente se convierte en una versión anterior de la red misma. La red juega contra sí misma, forzándola a mejorar.',
        metricsTitle: 'Cómo interpretar las métricas',
        metricsWinRate: '<strong>Win Rate:</strong> Porcentaje de victorias acumuladas. Un buen modelo debería tener >80%.',
        metricsPolicyLoss: '<strong>Policy Loss:</strong> Qué tan bien la red predice los movimientos correctos. Valores bajos = mejor.',
        metricsValueLoss: '<strong>Value Loss:</strong> Qué tan bien la red evalúa si una posición es ganadora. Valores bajos = mejor.',
        metricsQuality: '<strong>Calidad vs Random:</strong> Después de entrenar, la red juega 100 partidas greedy vs random. <strong>>90% = modelo excelente, >70% = bueno, <50% = necesita más entrenamiento.</strong>',
        heatmapTitle: 'Heatmap de policy',
        heatmapDesc: 'Cuando la red está pensando, ves porcentajes en cada casilla. Un 80% en el centro significa que la red está 80% segura de que jugar ahí es lo mejor. Si todas las casillas dicen ~11%, la red no tiene idea (todavía no aprendió).',
        tempTitle: 'Temperatura de juego',
        tempDesc: '<strong>0.0</strong> = la red siempre juega su mejor movimiento (greedy). <strong>1.0+</strong> = la red se vuelve más creativa y a veces prueba cosas inesperadas.',
        gpuTitle: 'GPU vs CPU',
        gpuDesc1: 'Arriba de las métricas ves <strong>"GPU (WebGL) activa"</strong> o <strong>"CPU (modo lento)"</strong>.',
        gpuItem1: '<strong>GPU (WebGL):</strong> Usa tu tarjeta gráfica. El entrenamiento es 5-10x más rápido. Recomendado.',
        gpuItem2: '<strong>CPU:</strong> Usa el procesador. Funciona pero el entrenamiento es lento. Puede pasar en navegadores sin aceleración hardware o en modo headless.',
        gpuDesc2: '<strong>No tienes que hacer nada.</strong> TensorFlow.js detecta automáticamente si tu navegador tiene WebGL y lo usa. Casi todos los navegadores modernos lo tienen activado por defecto.',
        whyLosesTitle: '¿Por qué la red a veces pierde?',
        whyLosesDesc: 'Con menos de 200 partidas de entrenamiento, la red aún está aprendiendo. También, si la <strong>temperatura</strong> es alta, la red explora en vez de explotar sus mejores movimientos.'
    },
    about: {
        title: 'Acerca de Gato Neura',
        body: `<p><strong>Gato Neura</strong> es un proyecto educativo de código abierto que enseña cómo funciona el aprendizaje por refuerzo estilo AlphaZero, directamente en tu navegador. Sin servidor, sin nube — todo corre localmente usando TensorFlow.js.</p>
        <p>La red neuronal aprende a jugar Tic-Tac-Toe jugando miles de partidas contra sí misma y contra un oponente minimax perfecto, guiada por Monte Carlo Tree Search (MCTS). Puedes verla aprender en tiempo real, inspeccionar sus pesos internos, e incluso descargar el modelo entrenado para compartirlo o continuar entrenando después.</p>
        <p>Construido con curiosidad y café por <a href="https://github.com/feojeda" target="_blank" rel="noopener">feojeda</a>.</p>
        <p><a href="https://github.com/feojeda/gato-neura" target="_blank" rel="noopener" class="github-link">Ver código en GitHub →</a></p>`
    },
    arena: {
        mode: 'Modo:',
        currentVsRandom: 'Modelo actual vs Aleatorio',
        uploadVsRandom: 'Modelo cargado vs Aleatorio',
        uploadVsCurrent: 'Modelo cargado vs Actual',
        uploadVsUpload: 'Modelo cargado A vs Modelo cargado B',
        modelA: 'Modelo A',
        modelB: 'Modelo B',
        games: 'Partidas:',
        start: 'Iniciar Batalla',
        results: 'Resultados',
        winsA: 'Victorias A:',
        draws: 'Empates:',
        winsB: 'Victorias B:',
        winRateA: 'Tasa de victoria A:',
        ready: 'Listo',
        battleInProgress: 'Batalla en progreso...'
    },
    tooltip: {
        details: 'Click para ver detalles'
    },
    errors: {
        couldNotVerifyArch: 'No se pudo verificar arquitectura del modelo, se creará uno nuevo',
        cannotLoadWhileTraining: 'No se puede cargar un modelo mientras el entrenamiento está en curso. Detén el entrenamiento primero.'
    }
};
