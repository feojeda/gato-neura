# Cómo Aprenden las Redes Neuronales a Jugar: Un Tutorial Interactivo en el Navegador

*Observa cómo una red neuronal se enseña a jugar tic-tac-toe en tiempo real — sin instalación, sin nube, sin API keys.*

---

## El Problema de Aprender IA

Si alguna vez intentaste entender cómo aprenden las redes neuronales, probablemente te topaste con el mismo muro que yo:

1. **La teoría es abstracta.** Lees sobre retropropagación, funciones de pérdida y aprendizaje por refuerzo — pero todo es matemática en una página.
2. **La configuración es dolorosa.** La mayoría de los tutoriales de ML requieren Python, Conda, CUDA, Jupyter notebooks, y una GPU que cuesta más que tu alquiler.
3. **El entrenamiento es invisible.** Ejecutas `model.fit()`, esperas 3 horas, y obtienes un número. ¿Qué pasó realmente adentro? Ni idea.

¿Y si pudieras **ver** a una red neuronal aprender? ¿Y si pudieras abrir una pestaña del navegador, darle a "Entrenar," y observar cómo la red pasa de hacer movimientos completamente aleatorios a jugar tic-tac-toe perfecto frente a tus ojos?

Eso es exactamente lo que hace [Gato Neura](https://feojeda.github.io/gato-neura/).

---

## ¿Qué es Gato Neura?

**Gato Neura** es un tutorial interactivo basado en navegador que te enseña cómo se entrenan las redes neuronales y los modelos de IA — mostrándote el proceso en tiempo real.

Es una implementación autocontenida de las ideas centrales de [AlphaZero](https://deepmind.google/research/highlighted-research/alphazero/) de DeepMind, escalada a tic-tac-toe para que corra completamente en tu navegador usando TensorFlow.js.

**Demo en vivo:** [https://feojeda.github.io/gato-neura/](https://feojeda.github.io/gato-neura/)

**Código fuente:** [https://github.com/feojeda/gato-neura](https://github.com/feojeda/gato-neura)

---

## ¿Por qué Tic-Tac-Toe?

El tic-tac-toe es el entorno de enseñanza perfecto:

- **Lo suficientemente pequeño** para correr en un navegador (9 entradas, ~3,000 parámetros)
- **Lo suficientemente complejo** para requerir aprendizaje real (la red debe descubrir estrategia, no solo memorizar)
- **Lo suficientemente visual** para que puedas *verla* mejorar (comienza colocando fichas al azar, luego aprende que el centro es poderoso, después descubre tenedores y bloqueos)
- **Juego resuelto** — así que sabes cómo se ve la "perfección" y puedes medir el progreso

Si una red puede aprender tic-tac-toe desde cero, los mismos principios aplican al ajedrez, Go, StarCraft y más allá.

---

## Lo que Verás

### 1. Métricas de Entrenamiento en Tiempo Real

Mientras la red entrena, ves actualizaciones en vivo:

- **Partidas jugadas** — cuántos juegos de autojuego ha completado la red
- **Tasa de victoria** — porcentaje de juegos ganados durante el entrenamiento
- **Pérdida de Política (Policy Loss)** — qué tan bien la red predice *qué* movimiento jugar
- **Pérdida de Valor (Value Loss)** — qué tan bien la red evalúa si una posición es ganadora
- **Calidad vs Aleatorio** — la prueba real: después de entrenar, la red juega 100 juegos greedy contra un oponente aleatorio

### 2. Visualización de la Red Neuronal

La red real se dibuja en pantalla. Puedes ver:

- **Arquitectura** — capa de entrada (9 neuronas para el tablero), capas ocultas (configurables), cabeza de política (9 salidas para movimientos), cabeza de valor (1 salida para probabilidad de victoria)
- **Pesos** — conexiones entre neuronas, codificadas por color de negativo (rojo) a positivo (verde)
- **Mapa de calor** — cuando la red está "pensando," ves una distribución de probabilidad sobre las 9 posiciones del tablero

### 3. El Viaje de Entrenamiento

La red atraviesa fases distintas:

| Fase | Qué ocurre |
|------|-----------|
| **0–50 partidas** | Juega contra un oponente aleatorio. Aprende movimientos básicos válidos. |
| **50+ partidas** | **MCTS se activa.** Antes de cada movimiento, la red simula N juegos en su "mente" para encontrar la mejor jugada. |
| **100+ partidas** | El oponente se convierte en una versión anterior de la red misma. Comienza el autojuego. |
| **Con minimax** | Opcional: mezcla un solucionador perfecto de tic-tac-toe como oponente. La red aprende de lo mejor. |

### 4. Descargar y Compartir Modelos

Después de entrenar, puedes **descargar el modelo entrenado como archivo JSON** y compartirlo. Otros pueden cargar tu modelo y continuar entrenando, o desafiarte a una partida.

---

## La Arquitectura (En Lenguaje Sencillo)

La red tiene dos "cabezas" — dos salidas separadas que aprenden cosas diferentes:

### Cabeza de Política: "¿Qué movimiento debo jugar?"

Toma el estado del tablero → genera 9 probabilidades (una por celda).

```
Entrada:  [0, 0, 0, 0, 1, 0, 0, -1, 0]   # X en el centro, O en la esquina
Salida:   [0.05, 0.05, 0.05, 0.05, 0.60, 0.05, 0.05, 0.05, 0.05]
                                      # 60% de confianza de que el centro es mejor
```

### Cabeza de Valor: "¿Estoy ganando?"

Toma el estado del tablero → genera un solo número de -1 (perdiendo) a +1 (ganando).

```
Entrada:  [1, 1, 0, -1, 0, 0, 0, 0, 0]   # X puede ganar en el siguiente movimiento
Salida:   0.85                              # La red piensa que está ganando
```

Ambas cabezas comparten las mismas capas ocultas, así que aprender sobre "posiciones ganadoras" (valor) también mejora "qué movimiento jugar" (política).

---

## Cómo Aprende: Autojuego + MCTS

La red no aprende de un dataset. Aprende de la **experiencia**:

1. **Jugar una partida** — La red juega contra sí misma (o un oponente aleatorio/minimax)
2. **Registrar posiciones** — Cada estado del tablero y el movimiento elegido se guardan
3. **MCTS mejora los objetivos** — Monte Carlo Tree Search ejecuta 50+ simulaciones por movimiento, refinando qué movimientos son realmente buenos
4. **Entrenar con la experiencia** — La red se actualiza para predecir mejor los movimientos mejorados por MCTS (política) y el resultado del juego (valor)
5. **Repetir** — La red mejorada juega mejores partidas, generando mejores datos de entrenamiento

Este es el mismo bucle que hizo a AlphaGo y AlphaZero campeones mundiales.

---

## Sin Instalación. En Serio.

Abre [la demo](https://feojeda.github.io/gato-neura/), haz clic en **Entrenar**, y obsérvala aprender.

Eso es todo.

No `pip install`. No `conda env create`. No drivers de GPU. No Jupyter notebook que se cuelga porque olvidaste `tf.reset_default_graph()`.

Funciona en:
- Tu laptop
- Tu teléfono
- Una computadora de biblioteca
- El iPad de tu abuela

Porque corre completamente en el navegador usando TensorFlow.js.

---

## ¿Para Quién es Esto?

- **Estudiantes** que aprenden cómo funcionan las redes neuronales — ve la matemática cobrar vida
- **Desarrolladores** curiosos sobre RL, MCTS y autojuego
- **Educadores** que necesitan una demo de ML en navegador para el aula
- **Principiantes** que quieren entender AlphaZero sin leer un paper de 40 páginas
- **Cualquiera** que quiera ver un modelo de IA entrenarse a sí mismo en tiempo real

---

## Pruébalo Tú Mismo

1. Abre **[la demo en vivo](https://feojeda.github.io/gato-neura/)**
2. Haz clic en **Entrenar** (comienza con 200–500 partidas)
3. Observa las métricas actualizarse en tiempo real
4. Después de entrenar, haz clic en una celda del tablero para jugar contra tu red entrenada
5. Activa el **oponente minimax** y entrena de nuevo — ve si la red puede vencer a un jugador perfecto

**Consejo pro:** Abre las DevTools de tu navegador (F12) y puedes leer el JavaScript exacto que se ejecuta. Sin binarios compilados, sin lógica oculta. ~2,000 líneas de JS vanilla.

---

## ¿Qué Hay Debajo del Capó?

- **TensorFlow.js 4.22** — para la red neuronal
- **Monte Carlo Tree Search** — para selección de movimientos y mejora de política
- **Solucionador minimax** — oponente perfecto de tic-tac-toe con tabla de transposición
- **Bucle de entrenamiento personalizado** — sin `model.fit()`, `optimizer.minimize()` manual para gradient clipping
- **Visualización en tiempo real** — renderizado SVG tipo D3 de la arquitectura de la red
- **Multilingüe** — English, Español, 中文, 日本語
- **Cero paso de build** — abre `index.html` y funciona

---

## El Código

```javascript
// El bucle de entrenamiento completo tiene ~100 líneas
async function trainLoop(model, config, callbacks) {
    const { numGames, batchSize, lr, mctsSims } = config;
    const optimizer = tf.train.adam(lr);
    const replayBuffer = new ReplayBuffer(5000);
    
    for (let g = 0; g < numGames; g++) {
        // Partida de autojuego con MCTS
        const examples = await playOneGame(model, mctsSims);
        replayBuffer.push(examples);
        
        // Entrenar con experiencia pasada
        if (replayBuffer.length >= batchSize) {
            const batch = replayBuffer.sample(batchSize);
            await trainOnBatch(model, batch, optimizer);
        }
    }
}
```

Código fuente completo: [github.com/feojeda/gato-neura](https://github.com/feojeda/gato-neura)

---

## Por Qué lo Construí

Quería entender AlphaZero. Leí el paper. Vi las conferencias. Pero todavía no lo *entendía*.

Así que construí la versión más pequeña posible — una que pudiera correr en un navegador, observar en tiempo real, y realmente comprender. El tic-tac-toe es trivial para un humano, pero sorprendentemente no trivial para una red neuronal que parte de la ignorancia completa.

Observar a la red pasar de "coloca fichas al azar" a "toma el centro" a "crea tenedores" a "bloquea tu movimiento ganador" — ese es el momento en que *sientes* cómo aprenden las redes neuronales.

---

## ¿Qué Sigue?

Algunas ideas que estoy explorando:

- **Conecta 4** — mismos principios, espacio de estados más grande
- **Comparación de modelos** — enfrentar dos modelos entrenados entre sí
- **Repetición de entrenamiento** — rebobinar y reproducir el proceso de entrenamiento movimiento a movimiento
- **Exportar a ONNX** — ejecutar el modelo entrenado en otros frameworks

¿Tienes ideas? [Abre un issue](https://github.com/feojeda/gato-neura/issues) o [envía un PR](https://github.com/feojeda/gato-neura/pulls).

---

## Aprende Más

- **Explicación no técnica:** [docs/EXPLAINED.es.md](https://github.com/feojeda/gato-neura/blob/main/docs/EXPLAINED.es.md)
- **Versión en inglés:** [README.md](https://github.com/feojeda/gato-neura/blob/main/README.md)

---

*Construido con curiosidad y café por [feojeda](https://github.com/feojeda). Licencia MIT.*
