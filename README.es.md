# Gato Neura

<p align="center">
  <a href="README.md"><img src="https://img.shields.io/badge/lang-en-blue" alt="English"></a>
  <img src="https://img.shields.io/badge/lang-es-green" alt="Español">
  <a href="README.zh.md"><img src="https://img.shields.io/badge/lang-zh-red" alt="中文"></a>
  <a href="README.ja.md"><img src="https://img.shields.io/badge/lang-ja-orange" alt="日本語"></a>
</p>

> **Una red neuronal estilo AlphaZero que aprende a jugar tic-tac-toe (gato) completamente en tu navegador.**

Sin backend. Sin nube. Sin API keys. Solo tu navegador, TensorFlow.js, y una red neuronal diminuta que se enseña a jugar perfecto tic-tac-toe mediante autojuego y busqueda en arbol de Monte Carlo.

**Demo en vivo:** [https://feojeda.github.io/gato-neura/](https://feojeda.github.io/gato-neura/)

**Explicacion no tecnica:** [docs/EXPLAINED.es.md](docs/EXPLAINED.es.md)

---

## Tabla de Contenidos

- [Que es esto?](#que-es-esto)
- [Inicio Rapido](#inicio-rapido)
- [Como Usar](#como-usar)
- [Entendiendo las Metricas](#entendiendo-las-metricas)
- [La Matematica Detras](#la-matematica-detras)
- [Arquitectura](#arquitectura)
- [Fases de Entrenamiento](#fases-de-entrenamiento)
- [Soporte Multilingue](#soporte-multilingue)
- [Contribuir](#contribuir)
- [Licencia](#licencia)

---

## Que es esto?

Gato Neura es una **implementacion educativa autocontenida** de las ideas centrales de AlphaZero de DeepMind, escalada a tic-tac-toe para que corra completamente en un navegador web.

Demuestra:
- **Redes neuronales de doble cabeza** (policy + value)
- **Aprendizaje por refuerzo mediante autojuego**
- **Monte Carlo Tree Search (MCTS)** para seleccion de movimientos
- **Curriculum learning** (oponente aleatorio -> snapshot de si misma)
- **Visualizacion en tiempo real** de pesos, arquitectura y metricas de entrenamiento

Todo en ~2,000 lineas de JavaScript vanilla con **cero paso de build**. Abre DevTools y lee exactamente el codigo que corre.

---

## Inicio Rapido

```bash
# Clonar
git clone https://github.com/feojeda/gato-neura.git
cd gato-neura

# Servir localmente (cualquier servidor estatico sirve)
python3 -m http.server 8080 --directory public
# o
npx serve public

# Abrir http://localhost:8080
```

Sin `npm install`. Sin bundler. Sin compilacion.

---

## Como Usar

La interfaz se divide en tres paneles:

### 1. Panel del Modelo (izquierda)
Muestra un grafo SVG en vivo de la arquitectura de la red neuronal. Haz clic en cualquier nodo para ver un heatmap de sus pesos entrantes.

### 2. Panel del Tablero (centro)
El juego en si. Elige quien empieza, ajusta la temperatura de juego, y juega contra la red entrenada.

- **Temperatura de juego**: `0.0` = siempre el mejor movimiento (greedy). `>1.0` = creativo, a veces aleatorio.
- **Pistas de policy**: Durante el turno de la red, aparecen porcentajes en cada casilla vacia mostrando la confianza de la red.

### 3. Panel de Controles (derecha)

#### Arquitectura del Modelo
Agrega/elimina capas ocultas antes de entrenar. Default: `[64, 32]`.

> **Tip:** Para tic-tac-toe, 2-3 capas de 32-64 neuronas es suficiente. Mas capas no ayudan y pueden ralentizar la convergencia.

#### Configuracion de Entrenamiento

| Configuracion | Default | Que hace |
|---------------|---------|----------|
| **Partidas** | 500 | Total de partidas de autojuego a generar |
| **Learning Rate** | 0.0003 | Tamano de paso para el descenso de gradiente |
| **Batch Size** | 64 | Ejemplos de entrenamiento por actualizacion |
| **Simulaciones MCTS** | 50 | Simulaciones por movimiento (0 = desactivado) |
| **Incremental** | off | Agregar al modelo existente o empezar de cero |

#### Boton Entrenar
Presiona **Entrenar** y observa las metricas actualizarse en tiempo real. El entrenamiento pausa la interfaz del juego.

---

## Entendiendo las Metricas

### Win Rate
Porcentaje de partidas que la red gano durante la sesion de entrenamiento actual.

| Badge | Significado |
|-------|-------------|
| 🟢 Excelente (>80%) | Domina al oponente actual |
| 🔵 Bueno (60-80%) | Gana la mayoria, aun aprendiendo |
| 🟡 Regular (40-60%) | Aun no domina |
| 🔴 Malo (<40%) | Pierde mas de lo que gana |

> El win rate de entrenamiento es contra un **oponente mixto** (aleatorio + snapshot antiguo). La prueba real es **Calidad vs Random**.

### Policy Loss
Que tan bien la red predice *cual* movimiento jugar.

Menor es mejor. Con 9 casillas, el azar puro tiene una perdida baseline de:

$$\mathcal{L}_{\text{azar}} = -\log\frac{1}{9} = 2.197$$

Una perdida de 2.1 significa que solo estas ~5% mejor que un dado.

| Badge | Umbral |
|-------|--------|
| 🟢 Excelente | < 1.0 |
| 🔵 Bueno | 1.0 - 1.5 |
| 🟡 Regular | 1.5 - 2.0 |
| 🔴 Malo | > 2.0 |

### Value Loss
Que tan bien la red evalua si una posicion es ganadora (+1), perdedora (-1), o empate (0).

Es Error Cuadratico Medio (MSE):

$$\mathcal{L}_V = \frac{1}{N}\sum_{i=1}^{N}(v_i^{\text{target}} - v_i^{\text{pred}})^2$$

| Badge | Umbral |
|-------|--------|
| 🟢 Excelente | < 0.3 |
| 🔵 Bueno | 0.3 - 0.6 |
| 🟡 Regular | 0.6 - 1.0 |
| 🔴 Malo | > 1.0 |

> Bajo value loss no es buen juego. La red podria evaluar bien pero no saber *que* mover.

### Calidad vs Random
Despues de entrenar, la red juega **100 partidas greedy** contra un oponente puramente aleatorio. Esta es la metrica de verdad.

| Resultado | Interpretacion |
|-----------|----------------|
| >90% | Juego casi perfecto. Vence a cualquier humano casual. |
| 70-90% | Fuerte, errores ocasionales. |
| 50-70% | Conoce lo basico, pierde tacticas. |
| <50% | Peor que el azar. Necesita mas entrenamiento o red mas grande. |

### Grafico de Perdida
Grafico en tiempo real de policy loss (azul) y value loss (rojo) sobre los ultimos 100 batches de entrenamiento.

---

## La Matematica Detras

### Arquitectura de la Red Neuronal

La red es un **perceptron multicapa** con dos cabezas de salida:

$$
\mathbf{x} \in \mathbb{R}^9 \xrightarrow{\text{Densa}} \mathbf{h}_1 \xrightarrow{\text{ReLU}} \mathbf{h}_2 \xrightarrow{\text{ReLU}} \begin{cases} \mathbf{p} \in \mathbb{R}^9 & \text{(Policy)} \\ v \in \mathbb{R} & \text{(Value)} \end{cases}
$$

**Codificacion de entrada:**
- $+1$: ficha de la red
- $-1$: ficha del oponente
- $0$: vacio

**Invariancia de perspectiva:** La red siempre se ve a si misma como $+1$. Si juega como O, el tablero se invierte antes de entrar a la red.

### Cabeza de Policy

Emite una distribucion de probabilidad sobre las 9 casillas usando softmax:

$$p_i = \frac{e^{z_i}}{\sum_{j} e^{z_j}}$$

Movimientos ilegales se enmascaran a probabilidad 0, luego se renormaliza la distribucion.

### Cabeza de Value

Una sola neurona con activacion $\tanh$, dando un escalar en $[-1, +1]$:

$$v = \tanh(w^T h + b)$$

### Perdida de Policy: Cross-Entropy

La red se entrena para coincidir con una policy objetivo $\pi$ (de los conteos de visitas de MCTS):

$$\mathcal{L}_P = -\frac{1}{N}\sum_{i=1}^{N}\sum_{j=1}^{9} \pi_{ij} \log \hat{p}_{ij}$$

Recortada para estabilidad numerica ($\varepsilon = 10^{-7}$):

$$\hat{p}_{ij} = \text{clip}(p_{ij}, \varepsilon, 1-\varepsilon)$$

### Perdida de Value: Error Cuadratico Medio

$$\mathcal{L}_V = \frac{1}{N}\sum_{i=1}^{N}(z_i - v_i)^2$$

donde $z_i \in \{-1, 0, +1\}$ es el resultado de la partida desde la perspectiva del jugador actual.

### Perdida Total

$$\mathcal{L} = \mathcal{L}_P + \mathcal{L}_V$$

### Muestreo con Temperatura

Durante el entrenamiento, los movimientos se samplean con temperatura $T$ para balancear exploracion vs explotacion:

$$\tilde{p}_i = \frac{p_i^{1/T}}{\sum_j p_j^{1/T}}$$

- $T = 1.0$: samplea de la policy cruda (mucha exploracion)
- $T \to 0$: siempre elige la mayor probabilidad (pura explotacion)
- En esta implementacion, $T$ decae linealmente de 1.0 a 0.3 durante el entrenamiento.

### Monte Carlo Tree Search (MCTS)

Despues de ~50 juegos, MCTS se activa. Para cada movimiento, la red corre $N$ simulaciones:

1. **Seleccion**: Recorre el arbol usando la puntuacion UCB1:

$$U(s, a) = Q(s, a) + c_{puct} \cdot P(a|s) \cdot \frac{\sqrt{N(s)}}{1 + N(s, a)}$$

2. **Expansion**: Al llegar a un nodo no visitado, lo expande usando la policy de la red.
3. **Evaluacion**: Usa el valor estimado por la red para nodos hoja.
4. **Backup**: Propaga el resultado hacia arriba, invirtiendo el signo en cada nivel (juego de suma cero).
5. **Seleccion de movimiento**: Juega proporcional a los conteos de visita.

Cada simulacion requiere un forward pass por la red, asi que 50 simulaciones es ~50x mas lento que juego greedy.

### Gradient Clipping

Para prevenir gradientes explosivos, los gradientes se recortan a una norma maxima:

$$\mathbf{g} \leftarrow \frac{\mathbf{g}}{\max(1, \|\mathbf{g}\|_2 / g_{\max})}$$

En esta implementacion, $g_{\max} = 1.0$.

---

## Arquitectura

```
public/
├── index.html              # Dashboard principal
├── css/styles.css          # Layout responsive
└── js/
    ├── app.js              # Orquestador, game loop
    ├── game.js             # Logica pura del juego (inmutable)
    ├── model.js            # Creacion/gestion del modelo TF.js
    ├── trainer.js          # Autojuego + MCTS + loop de entrenamiento
    ├── ui.js               # Bindings DOM, metricas, i18n
    ├── visualizer.js       # Renderizado SVG del modelo
    ├── i18n.js             # Motor i18n ligero
    └── translations/       # en, es, zh, ja
        ├── en.js
        ├── es.js
        ├── zh.js
        └── ja.js
```

**Filosofia de diseno:** Cero paso de build. Lo que ves en DevTools es exactamente lo que corre. Sin webpack, sin npm, sin transpilacion.

---

## Fases de Entrenamiento

El curriculum de entrenamiento tiene tres fases:

| Fase | Partidas | Oponente | MCTS | Proposito |
|------|----------|----------|------|-----------|
| 1 | 0-50 | Aleatorio | No | Aprender patrones ganadores basicos |
| 2 | 50-100 | Aleatorio + Snapshot | Si | Aprender tacticas via busqueda en arbol |
| 3 | 100+ | Snapshot (propio) | Si | Refinar contra version pasada |

Un **snapshot** del modelo se toma cada 100 partidas. Esta version anterior se convierte en el oponente, forzando al modelo actual a mejorar contra un enemigo mas fuerte.

---

## Soporte Multilingue

Gato Neura soporta 4 idiomas de fabrica:

- 🇺🇸 **English** (default)
- 🇪🇸 **Espanol**
- 🇨🇳 **中文 (Chino Simplificado)**
- 🇯🇵 **日本語 (Japones)**

Cambia idioma via el dropdown en el header. Tu preferencia se guarda en `localStorage`.

---

## Contribuir

Este proyecto es intencionalmente pequeno y legible. ¡Las contribuciones son bienvenidas!

### Ideas donde nos encantaria ayuda

- [ ] **Web Workers**: Mover el entrenamiento fuera del hilo principal para que la UI no se congele
- [ ] **Guardar/Cargar modelos**: Exportar pesos entrenados (JSON o localStorage)
- [ ] **Mejor visualizacion**: Heatmaps de policy por posicion, mapas de activacion
- [ ] **Mas juegos**: Cuatro en linea, damas, o Hex usando el mismo motor
- [ ] **Inspeccion manual de MCTS**: Clic en "Pensar" y ver el arbol de busqueda
- [ ] **Estimacion ELO**: Trackear rating estimado en el tiempo
- [ ] **Mas idiomas**: Cualquier idioma que hables
- [ ] **Tests**: Mas cobertura Playwright para casos edge

### Como contribuir

1. Haz fork del repo
2. Crea una rama: `git checkout -b feature/mi-idea`
3. Haz tus cambios
4. Corre tests: `node test-integration.mjs`
5. Abre un Pull Request contra `develop`

Sin CLA, sin burocracia. Si mejora el proyecto, lo mergeamos.

**Preguntas o ideas?** Abre un [Issue](https://github.com/feojeda/gato-neura/issues) o inicia una [Discussion](https://github.com/feojeda/gato-neura/discussions).

---

## Licencia

MIT © [Francisco Ojeda](https://github.com/feojeda)
