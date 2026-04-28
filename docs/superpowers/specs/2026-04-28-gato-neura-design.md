# Gato Neura — Red Neuronal para Tic-Tac-Toe

## Resumen

Aplicación web educativa 100% en el navegador que entrena una red neuronal estilo AlphaZero para jugar tic-tac-toe (gato). El usuario configura la arquitectura, gatilla el entrenamiento via self-play, visualiza el modelo en tiempo real, y juega contra la red. Sin backend, sin build step — solo archivos estáticos servidos por Caddy.

## Modelo de Red Neuronal

### Entrada (9 neuronas)

Vector flat de 9 elementos representando el tablero. Codificación:
- `+1`: ficha del jugador de la red
- `-1`: ficha del oponente
- `0`: casilla vacía

### Capas ocultas

Configurables por el usuario antes de cada entrenamiento. Defaults:
- Dense 1: 64 neuronas, activación ReLU
- Dense 2: 32 neuronas, activación ReLU

Restricciones: máximo 5 capas ocultas, máximo 128 neuronas por capa.

Cambiar la arquitectura reinicia los pesos (se pierde entrenamiento previo).

### Salida — dos cabezas

**Policy head:** Dense 9 neuronas, activación softmax. Probabilidad por casilla (dónde jugar). Se aplica máscara legal que descarta casillas ocupadas y se renormaliza.

**Value head:** Dense 1 neurona, activación tanh. Evaluación de posición en rango [-1, +1] (qué tan favorable está).

```
Input(9) → Dense(N, relu) × L capas → [Dense(9, softmax), Dense(1, tanh)]
```

## Motor de Juego

Representación interna: `Array[9]` con valores `-1, 0, 1`.

Funciones:
- `getValidMoves(board)`: retorna índices de casillas vacías
- `makeMove(board, pos, player)`: coloca ficha y retorna nuevo tablero
- `checkWinner(board)`: evalúa 8 líneas (3 filas, 3 columnas, 2 diagonales), retorna `+1/-1/0/null`
- `isTerminal(board)`: retorna `{over: bool, winner: int|null}`

Codificación de perspectiva: la red siempre juega como `+1`. Si es turno del oponente, se invierte el tablero antes de pasar por la red.

## Loop de Self-Play y Entrenamiento

### Self-play

1. Iniciar tablero vacío
2. Por cada turno: consultar red → obtener policy → enmascarar ilegales → renormalizar → samplear con temperatura (decae durante entrenamiento)
3. Almacenar `(estado, policy, jugador)` de cada turno en un buffer
4. Al terminar: recorrer buffer, asignar value target según resultado final (+1 ganó, -1 perdió, 0 empate) para ese jugador

### Entrenamiento

Loss compuesto:
- Policy loss: `crossEntropy(policy_pred, policy_target)`
- Value loss: `MSE(value_pred, value_target)`
- Total: `policy_loss + value_loss`

Optimizador: Adam con learning rate configurable (default: 0.001).
Batch size configurable (default: 64).

### Configuración del usuario

| Parámetro | Default | Rango |
|-----------|---------|-------|
| Capas ocultas | [64, 32] | 1-5 capas, 1-128 neuronas c/u |
| Partidas de self-play | 500 | 100-5000 |
| Learning rate | 0.001 | libre |
| Batch size | 64 | libre |

Controles: botón Iniciar/Detener entrenamiento.

### Durante el juego contra la red

La red usa policy head de forma greedy: argmax sobre casillas legales (sin exploración). Se muestra el value head como indicador de confianza.

## Interfaz de Usuario — Dashboard

Layout responsive con 3 zonas.

### Panel izquierdo: Visualización del modelo

- Grafo de nodos interactivo en SVG: capas como columnas de nodos, conexiones entre ellos
- Color de conexiones refleja pesos: rojo=negativo, azul=positivo, intensidad=magnitud
- Click en nodo muestra heatmap detallado de sus pesos
- Se actualiza en tiempo real durante el entrenamiento
- Leyenda de colores

### Panel central: Tablero de juego

- Grilla 3x3 responsive (tic-tac-toe)
- Jugador usa X, red usa O
- Indicador de turno
- Indicador de confianza de la red (value head) como barra o número
- Botones: Nueva partida, Reiniciar
- Historial de resultados de la sesión (victorias/derrotas/empates)

### Panel derecho: Controles y métricas

- **Configuración del modelo:** lista editable de capas ocultas con neuronas por capa, agregar/eliminar capas
- **Parámetros de entrenamiento:** partidas, learning rate, batch size
- **Métricas en vivo:** partidas jugadas/total, win rate en self-play, loss (policy + value), barra de progreso

### Responsive

- Desktop: 3 columnas lado a lado
- Tablet: 2 columnas (modelo + tablero arriba, controles abajo)
- Mobile: stack vertical (tablero → controles → modelo)

## Estructura de Archivos

```
gato-neura/
├── public/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── app.js          # Orquestador principal
│       ├── game.js         # Motor de juego
│       ├── model.js        # Creación/gestión modelo TF.js
│       ├── trainer.js      # Loop de self-play + entrenamiento
│       ├── visualizer.js   # Grafo de nodos SVG + heatmaps
│       └── ui.js           # Bindings DOM, eventos, métricas
├── docs/
│   └── superpowers/
│       └── specs/
└── .gitignore
```

## Dependencias

TensorFlow.js (`@tensorflow/tfjs`) cargado desde CDN. Sin npm, sin bundler, sin build step.

## Deploy

Caddy (ya existente en la VPS) sirve `public/` como estáticos en un path configurado. Sin configuración adicional del lado del proyecto.

## Mejoras futuras

- Implementar la red neuronal desde cero sin TensorFlow.js como alternativa educativa
- Web Worker para no bloquear el UI thread durante entrenamientos largos
- Guardar/cargar modelo entrenado (localStorage o descarga de pesos)
