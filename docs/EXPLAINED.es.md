# Gato Neura Explicado — Para Lectores No Tecnicos

> *No necesitas un titulo en matematicas para entender como una red neuronal aprende a jugar gato.*

---

## Que es esto?

**Gato Neura** es un pequeno programa de computadora que se ensena a jugar gato (tic-tac-toe) jugando miles de partidas contra si mismo. Corre completamente en tu navegador web — sin nube, sin servidores, sin cuentas.

Imagina que es como un nino aprendiendo un juego de mesa:
- Al principio, el nino mueve completamente al azar.
- Despues de perder algunas veces, empieza a notar patrones: "Si pongo mi ficha en el centro, gano mas seguido."
- Eventualmente, se vuelve invencible.

Eso es exactamente lo que hace este programa. Solo que en vez de un nino, es un **cerebro diminuto hecho de matematicas** — una red neuronal con apenas unos cientos de "neuronas".

---

## El "Cerebro" — Explicado con una Analogia

Imagina que estas tratando de predecir si manana llovera. Miras varias pistas:
- Esta nublado? (+1 si si, -1 si no)
- La humedad es alta? (+1 / -1)
- Hay viento? (+1 / -1)

Combinas estas pistas en tu cabeza, dandole mas peso a algunas que a otras, y llegas a una corazonada: "70% de probabilidad de lluvia."

Una red neuronal hace **exactamente lo mismo**, pero con numeros:
- Recibe 9 entradas (las 9 casillas del tablero)
- Cada entrada es +1 (mi ficha), -1 (ficha del oponente), o 0 (vacio)
- Pasa estos datos por capas de "neuronas" que ponderan y combinan la informacion
- Al final, produce dos cosas:
  1. **"Donde deberia jugar?"** (una probabilidad para cada casilla)
  2. **"Estoy ganando o perdiendo?"** (una puntuacion de -1 a +1)

La magia es que la red **empieza completamente perdida**. Aprende por ensayo y error, ajustando esos pesos cada vez que gana o pierde.

---

## Como Aprende?

### Fase 1: Aprendiendo de un Oponente Borracho

Durante las primeras 50 partidas, la red juega contra alguien que mueve completamente al azar — como una persona borracha apretando botones.

Esto es util! El oponente borracho comete errores terribles, asi que la red rapidamente aprende patrones ganadores basicos:
- "Si tengo dos en linea y la tercera esta vacia, deberia jugar ahi para ganar."
- "Si mi oponente tiene dos en linea, debo bloquear o pierdo."

### Fase 2: Pensando Adelante con MCTS

Despues de 50 partidas, la red activa **MCTS** (Monte Carlo Tree Search). Piensa en ello como la red "sonando despierta" sobre futuros posibles.

Antes de hacer un movimiento, la red imagina: *"Que pasa si juego aqui? Que podria hacer mi oponente? Que haria yo despues?"* Juega docenas de partidas imaginarias en su cabeza y elige el movimiento que lleva a mas victorias.

Es como un jugador de ajedrez que piensa varios movimientos adelante — solo que esta red solo necesita pensar 2-3 movimientos porque el gato es un juego muy pequeno.

### Fase 3: Jugando Contra su Yo Mas Joven

Despues de 100 partidas, la red empieza a jugar contra una **version anterior de si misma** — como un gran maestro de ajedrez revisando sus partidas de hace seis meses.

Por que? Porque vencer a un oponente aleatorio es facil. Vencer a ti mismo de la semana pasada es dificil. Esto fuerza a la red a seguir mejorando.

---

## Que Significan los Numeros?

Cuando entrenas la red, veras cuatro metricas. Aqui que significan en lenguaje sencillo:

### Win Rate
"De 100 partidas, cuantas gano la red?"

- **Sobre 80%** — La red esta aplastando a su oponente actual.
- **40-60%** — Mas o menos parejo. Necesita mas practica.
- **Bajo 40%** — Esta perdiendo mas de lo que gana. Algo anda mal (tal vez el learning rate es muy alto).

> **Importante:** Este win rate es contra un oponente mixto (a veces aleatorio, a veces una version anterior de si misma). La **prueba real** es "Calidad vs Random".

### Policy Loss
"Que tan buena es la red prediciendo el movimiento correcto?"

Piensa en ello como un examen de opcion multiple con 9 opciones. Una puntuacion de **2.2** significa que la red esta adivinando al azar (como lanzar una moneda). Una puntuacion de **1.5** significa que esta acertando algunas. Debajo de **1.0** significa que usualmente sabe el mejor movimiento.

### Value Loss
"Que tan buena es la red juzgando si una posicion es ganadora o perdedora?"

Esto es como preguntarle a alguien que prediga el clima. Si dice "70% de probabilidad de lluvia" y llueve, acerto. Si dice "soleado" y diluvia, fallo.

La red intenta predecir: "Si el juego terminara ahora, ganaria (+1), perderia (-1), o empataria (0)?" Mientras mas cerca esten sus predicciones de la realidad, mas bajo es este numero.

> **Nota:** Una red puede ser excelente juzgando posiciones pero aun jugar mal. Es como alguien que puede analizar una partida de ajedrez perfectamente pero se olvida de proteger a su reina.

### Calidad vs Random
"Si la red juega en serio (sin movimientos aleatorios), que tan seguido le gana a un mono apretando botones?"

Esta es la **metrica mas honesta**. Despues de entrenar, la red juega 100 partidas contra un oponente puramente aleatorio sin creatividad.

- **Sobre 90%** — Juego casi perfecto. Le ganaria a cualquier humano casual.
- **50-70%** — Sabe lo basico pero comete errores tacticos.
- **Bajo 50%** — Peor que un mono. Necesita mucho mas entrenamiento.

---

## Por Que el Entrenamiento A Veces es Lento?

La parte mas lenta es **MCTS**. Cada vez que la red hace un movimiento, corre 50 simulaciones — cada una requiere que la red "piense" sobre un futuro posible.

Imagina leer 50 versiones diferentes del periodico de manana antes de decidir que vestir. Eso es MCTS.

Puedes acelerarlo:
- Poniendo Simulaciones MCTS en **0** (sin pensar adelante — mas rapido pero menos preciso)
- Poniendo MCTS en **10-20** (pensamiento ligero — buen balance)
- Usando una computadora con **GPU** (tarjeta grafica) en vez de CPU

---

## Por Que la Red A Veces Pierde?

Tres razones:

1. **No suficiente entrenamiento.** Con menos de 200 partidas, todavia es principiante. Piensa en un nino que solo ha jugado 5 partidas de ajedrez.

2. **Temperatura alta.** Si el slider de "temperatura de juego" esta sobre 0, la red a veces hace movimientos aleatorios a proposito — para explorar nuevas estrategias. Ponlo en 0 si quieres que juegue lo mejor posible.

3. **El gato es un juego resuelto.** Con juego perfecto, todas las partidas terminan en empate. La red solo puede ganar si el humano (o oponente aleatorio) comete un error. Contra un jugador perfecto, lo mejor que puede hacer es empatar.

---

## Consejos para Obtener los Mejores Resultados

1. **Empieza con 500 partidas, MCTS = 0.** Deja que aprenda lo basico rapidamente.
2. **Luego entrena 500 mas con MCTS = 50.** Ahora aprende a pensar adelante.
3. **Revisa "Calidad vs Random" despues de cada sesion.** Esa es tu puntuacion real.
4. **Si la calidad se queda atascada bajo 50% despues de 1000+ partidas**, prueba agregar una capa (ej. `[128, 64, 32]`).
5. **Juega con temperatura = 0** si quieres ver su mejor juego.

---

## Puedo Romperlo?

Absolutamente. Esta es una red diminuta con unos pocos miles de parametros. El AlphaZero real uso millones de parametros y corrio en supercomputadoras. Esta es la "version de juguete" — disenada para caber en un navegador y ser comprensible.

Cosas que lo romperan o confundiran:
- Entrenar con un learning rate locamente alto (entra en panico y produce tonterias)
- Entrenar solo 10 partidas (no aprendera nada)
- Una sola capa oculta con 2 neuronas (demasiado pequeno para recordar algo)

Pero eso es parte de la diversion! Experimenta y mira que pasa.

---

## Quieres Aprender Mas?

- **Inmersion tecnica:** [README.md](../README.md)
- **Mira a AlphaZero vencer al ajedrez:** Busca "AlphaZero vs Stockfish" en YouTube
- **Lee el codigo:** Abre DevTools (F12) -> Sources -> `js/trainer.js`. Esta lleno de comentarios.

---

*Gato Neura fue construido para demostrar que la IA no es magia — solo es reconocimiento de patrones, ensayo y error, y mucha paciencia.*
