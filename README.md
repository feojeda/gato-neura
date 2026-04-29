# Gato Neura

Red neuronal estilo AlphaZero que aprende a jugar tic-tac-toe (gato) directamente en el navegador. Entrena mediante self-play y juego contra oponentes aleatorios, con visualización en tiempo real de la arquitectura y pesos del modelo.

**Demo:** https://feojeda.github.io/gato-neura/

---

## Tabla de Contenidos

- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Modelo Neuronal](#modelo-neuronal)
- [Motor de Juego](#motor-de-juego)
- [Estrategia de Entrenamiento](#estrategia-de-entrenamiento)
- [Visualización](#visualización)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura de Archivos](#estructura-de-archivos)
- [Desarrollo Local](#desarrollo-local)
- [Deploy](#deploy)
- [Tests](#tests)
- [Limitaciones y Mejoras Futuras](#limitaciones-y-mejoras-futuras)

---

## Arquitectura del Sistema

El proyecto es una aplicación **100% cliente-side** que corre completamente en el navegador sin backend. Consta de tres componentes principales:

1. **Dashboard UI**: Interfaz responsive con tablero de juego, controles de entrenamiento y panel de métricas
2. **Motor de Inferencia**: Red neuronal implementada con TensorFlow.js que evalúa posiciones y sugiere movimientos
3. **Motor de Entrenamiento**: Algoritmo de self-play con curriculum learning (oponente aleatorio + self-play)

### Flujo de Datos

```
Usuario (clic en celda) → app.js → game.js (actualiza tablero)
                                    ↓
                              model.js (predice)
                                    ↓
                              trainer.js (entrena)
                                    ↓
                         visualizer.js (renderiza pesos)
                                    ↓
                              ui.js (actualiza métricas)
```

---

## Modelo Neuronal

### Arquitectura

```
Input(9) → Dense(64, relu) → Dense(32, relu) → [Policy(9, softmax), Value(1, tanh)]
```

**Capa de Entrada (9 neuronas):**
Codificación del tablero como vector flat:
- `+1`: ficha del jugador de la red
- `-1`: ficha del oponente  
- `0`: casilla vacía

**Capas Ocultas (configurables):**
- Default: `[64, 32]` neuronas con activación ReLU
- Máximo 5 capas, máximo 128 neuronas por capa
- El usuario puede agregar/eliminar capas antes de entrenar

**Cabeza de Policy (9 neuronas, softmax):**
Probabilidad de jugar en cada una de las 9 casillas. Se aplica una máscara legal que:
1. Descarta casillas ocupadas (las pone en 0)
2. Renormaliza las probabilidades restantes
3. Si todas son 0 (caso extremo), usa distribución uniforme sobre casillas vacías

**Cabeza de Value (1 neurona, tanh):**
Evaluación de la posición actual en rango `[-1, +1]`:
- `+1`: posición ganadora segura
- `-1`: posición perdedora segura
- `0`: empate o neutral

### Codificación de Perspectiva

La red **siempre juega como X** (`+1`). Cuando le toca jugar como O, el tablero se invierte antes de pasar por la red:

```javascript
// Si la red juega como O, invertimos el tablero
const perspectBoard = currentPlayer === PLAYER_X ? board : invertBoard(board);
// Ahora las fichas de la red aparecen como +1 y las del oponente como -1
```

Esto permite entrenar una sola red que aprende desde una perspectiva consistente.

---

## Motor de Juego

### Representación

El tablero es un array de 9 enteros:
```javascript
const board = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // Vacío
// Índices: 0 1 2
//           3 4 5
//           6 7 8
```

### Funciones Principales

- `createBoard()`: Retorna tablero vacío
- `getValidMoves(board)`: Retorna índices de casillas vacías
- `makeMove(board, pos, player)`: Retorna **nuevo tablero** (inmutable, no muta el original)
- `checkWinner(board)`: Evalúa 8 líneas posibles (3 filas + 3 columnas + 2 diagonales)
- `isTerminal(board)`: Retorna `{over: bool, winner: int|null}`
- `invertBoard(board)`: Intercambia X y O (para cambio de perspectiva)

### Inmutabilidad

Todas las funciones son **puras** — no mutan el estado, siempre retornan nuevos objetos. Esto es crítico para el entrenamiento, donde se almacenan múltiples estados de un mismo juego.

---

## Estrategia de Entrenamiento

### Curriculum Learning

El entrenamiento usa una mezcla de dos estrategias:

1. **vs Oponente Aleatorio (40% inicial + 50% alternado):**
   - La red juega como X contra un oponente que elige movimientos completamente al azar
   - Esto le da ejemplos de partidas ganadoras desde el inicio
   - La red aprende a castigar errores obvios y a forzar victorias

2. **Self-Play (50% alternado):**
   - La red juega contra sí misma
   - Ambos jugadores usan la misma red, pero con temperatura de exploración
   - Temperatura decae linealmente de 1.0 (exploración) a 0.3 (explotación)

### Loop de Entrenamiento

```javascript
for cada partida:
    1. Jugar partida (vs random o self-play)
    2. Almacenar (estado, policy, jugador) de cada turno
    3. Al terminar: asignar reward final a todos los ejemplos
       +1 si ganó, -1 si perdió, 0 si empate
    4. Cada 10 partidas o cuando buffer >= batch_size:
       - Entrenar batch con Adam optimizer
       - Loss = policy_loss + value_loss
```

### Cálculo de Loss

**Policy Loss:** Cross-entropy entre la distribución de probabilidad predicha y el target (movimientos que llevaron a victoria).

Como `tf.losses.categoricalCrossentropy` no existe en TF.js, se implementa manualmente:

```javascript
const epsilon = 1e-7;
const clippedPred = tf.clipByValue(pPred, epsilon, 1 - epsilon);
const pLoss = tf.neg(tf.mean(tf.sum(tf.mul(policyYs, tf.log(clippedPred)), -1)));
```

**Value Loss:** Mean Squared Error entre el valor predicho y el resultado real:

```javascript
const vLoss = tf.losses.meanSquaredError(valueYs, vPred).mean();
```

**Loss Total:** `loss = pLoss + vLoss`

### Temperatura

La temperatura controla la exploración/explotación durante el self-play:

```javascript
const temperature = Math.max(0.3, 1.0 - (gameNumber / totalGames) * 0.7);
```

- Al inicio (temp=1.0): movimientos casi aleatorios, mucha exploración
- Al final (temp=0.3): la red juega sus mejores movimientos, refinamiento

Los movimientos se samplean con:

```javascript
probs[i] = Math.pow(validPolicy[i], 1 / temperature);
```

### Parámetros Configurables

| Parámetro | Default | Rango |
|-----------|---------|-------|
| Partidas | 500 | 100 - 5000 |
| Learning Rate | 0.0003 | 0.0001 - 0.1 |
| Batch Size | 64 | 16 - 256 |
| Capas Ocultas | [64, 32] | 1-5 capas, 1-128 neuronas |

---

## Visualización

### Grafo de Nodos (SVG)

Muestra la arquitectura de la red como un grafo dirigido:
- **Nodos**: Círculos representando neuronas (máximo 12 por capa, con indicador "+N" si hay más)
- **Conexiones**: Líneas entre capas adyacentes, coloreadas según el peso:
  - Azul: peso positivo
  - Rojo: peso negativo
  - Intensidad: magnitud del peso
- **Máximo 50 conexiones** para no saturar la visualización

### Heatmap de Pesos

Al hacer clic en un nodo, muestra una matriz de colores con los pesos de la conexión. Si la matriz es muy grande (>2500 celdas), muestra un mensaje indicando que es muy grande para visualizar.

### Métricas en Tiempo Real

Durante el entrenamiento se muestra:
- Progreso de partidas (barra + contador)
- Win Rate (% de victorias de la red)
- Policy Loss (cross-entropy)
- Value Loss (MSE)

La visualización se actualiza cada 50 partidas para no relentizar el entrenamiento.

---

## Stack Tecnológico

- **HTML5 + CSS3**: Layout responsive con CSS Grid
- **JavaScript ES Modules**: Sin bundler, sin transpilación
- **TensorFlow.js 4.22.0**: Red neuronal y entrenamiento (cargado desde CDN)
- **SVG**: Visualización del modelo
- **GitHub Actions**: Deploy automático a GitHub Pages
- **Playwright**: Tests de integración headless

### Por qué sin build step

El objetivo es que el código sea completamente legible y modificable por cualquiera que abra DevTools. Sin webpack, sin npm, sin pasos de compilación. Todo el código fuente es exactamente lo que corre en el navegador.

---

## Estructura de Archivos

```
gato-neura/
├── public/                    # Archivos servidos (GitHub Pages)
│   ├── index.html            # Página principal con dashboard
│   ├── css/
│   │   └── styles.css        # Estilos responsive
│   └── js/
│       ├── app.js            # Orquestador principal
│       ├── game.js           # Motor de juego (lógica pura)
│       ├── model.js          # Creación y gestión del modelo TF.js
│       ├── trainer.js        # Self-play + loop de entrenamiento
│       ├── visualizer.js     # Renderizado SVG del modelo
│       └── ui.js             # Bindings DOM y métricas
├── .github/
│   └── workflows/
│       └── deploy.yml        # CI/CD para GitHub Pages
├── docs/
│   └── superpowers/
│       ├── specs/            # Especificación de diseño
│       └── plans/            # Plan de implementación
├── test-game.mjs             # Tests del motor de juego (Node.js)
├── test-tf-api.mjs           # Tests de integración TF.js (Playwright)
├── debug-training.mjs        # Debug del entrenamiento (Playwright)
├── README.md                 # Este archivo
└── .gitignore
```

---

## Desarrollo Local

### Requisitos

- Node.js 18+ (solo para tests)
- Navegador moderno con soporte ES Modules

### Ejecutar

Servir la carpeta `public/` con cualquier servidor estático:

```bash
# Con Python
python3 -m http.server 8080 --directory public

# Con Node.js
npx serve public

# Con PHP
php -S localhost:8080 -t public
```

Luego abrir http://localhost:8080

### Tests

**Motor de juego (rápido, sin navegador):**
```bash
node test-game.mjs
```

**Integración completa (con Playwright):**
```bash
npm install --no-save @playwright/test
npx playwright install chromium
node test-tf-api.mjs
```

---

## Deploy

Cada push a la rama `develop` dispara un workflow de GitHub Actions que:

1. Sube la carpeta `public/` como artifact
2. Deploya a GitHub Pages automáticamente

La URL del sitio es: `https://feojeda.github.io/gato-neura/`

**Nota sobre cache:** GitHub Pages puede cachear archivos estáticos agresivamente. Si haces cambios y no ves reflejados:
- Forzar reload: `Ctrl + F5` (o `Cmd + Shift + R`)
- Usar pestaña de incógnito
- Agregar `?v=N` a la URL

---

## Tests

### test-game.mjs

16 tests unitarios para el motor de juego:
- Creación de tablero
- Movimientos válidos
- Inmutabilidad
- Detección de ganador (filas, columnas, diagonales)
- Estados terminales (victoria, empate, en progreso)
- Inversión de tablero

### test-tf-api.mjs

Tests de integración con Playwright:
- Verifica disponibilidad de la API de TensorFlow.js
- Entrena 100 partidas y verifica que no haya errores
- Verifica que las losses sean valores numéricos finitos

### Limitaciones de Testing

El mayor desafío fue probar `trainer.js` porque:
1. Requiere TensorFlow.js (solo corre en navegador, no en Node.js puro)
2. El entrenamiento es asíncrono y no determinista
3. Los pesos iniciales son aleatorios, haciendo difícil asserts exactos

La solución fue usar Playwright para correr los tests en un navegador headless real, capturando errores de consola y verificando métricas.

---

## Limitaciones y Mejoras Futuras

### Limitaciones Actuales

1. **Sin WebGL en headless:** Los tests de Playwright corren sin GPU, TF.js usa CPU (más lento)
2. **Sin MCTS:** AlphaZero real usa Monte Carlo Tree Search para explorar el árbol de juego. Esta implementación usa solo la policy head con temperatura.
3. **Sin memoria de replay:** Los ejemplos se descartan inmediatamente después de entrenar el batch. Un buffer de experiencia circular mejoraría estabilidad.
4. **Red pequeña:** Para tic-tac-toe es suficiente, pero no escalaría a juegos más complejos.

### Mejoras Posibles

1. **Implementar desde cero:** Reemplazar TensorFlow.js con una implementación manual de backpropagation para máximo valor educativo
2. **Web Workers:** Mover el entrenamiento a un worker para no bloquear la UI
3. **Guardar/Cargar modelos:** Exportar/importar pesos entrenados (localStorage o descarga)
4. **MCTS:** Agregar búsqueda en árbol para movimientos de mayor calidad
5. **Replay Buffer:** Mantener los últimos N ejemplos y samplear batches aleatorios
6. **Más métricas:** Win rate vs oponente aleatorio, ELO estimado, heatmap de política por posición

---

## Créditos

Inspirado en:
- **AlphaGo / AlphaZero** (DeepMind): Arquitectura de red dual (policy + value) y self-play
- **TensorFlow.js**: Motor de inferencia y entrenamiento en el navegador

---

## Licencia

MIT
