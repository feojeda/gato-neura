export function createModel(hiddenLayers = [64, 32]) {
    if (!Array.isArray(hiddenLayers) || !hiddenLayers.every(n => Number.isInteger(n) && n > 0)) {
        throw new Error('hiddenLayers must be an array of positive integers');
    }

    const input = tf.input({ shape: [9], name: 'board_input' });

    let x = input;
    hiddenLayers.forEach((neurons, i) => {
        x = tf.layers.dense({
            units: neurons,
            activation: 'relu',
            name: `hidden_${i}`
        }).apply(x);
    });

    const policyHead = tf.layers.dense({
        units: 9,
        activation: 'softmax',
        name: 'policy'
    }).apply(x);

    const valueHead = tf.layers.dense({
        units: 1,
        activation: 'tanh',
        name: 'value'
    }).apply(x);

    const model = tf.model({
        inputs: input,
        outputs: [policyHead, valueHead],
        name: 'gato_neura'
    });

    return model;
}

export async function predict(model, board) {
    if (!Array.isArray(board) || board.length !== 9) {
        throw new Error('board must be an array of length 9');
    }

    const input = tf.tensor2d([board]);
    let policyTensor, valueTensor;
    try {
        [policyTensor, valueTensor] = model.predict(input);
        const policy = await policyTensor.array();
        const value = (await valueTensor.array())[0][0];
        return { policy: policy[0], value };
    } finally {
        input.dispose();
        if (policyTensor) policyTensor.dispose();
        if (valueTensor) valueTensor.dispose();
    }
}

export function getWeights(model) {
    const weights = [];
    for (let i = 0; i < model.layers.length; i++) {
        const layer = model.layers[i];
        const layerWeights = layer.getWeights();
        if (layerWeights.length > 0) {
            weights.push({
                name: layer.name,
                kernel: layerWeights[0].arraySync(),
                bias: layerWeights[1] ? layerWeights[1].arraySync() : null
            });
        }
    }
    return weights;
}

export function getModelInfo(model) {
    const layerSizes = [model.inputs[0].shape[1]];
    for (const layer of model.layers) {
        const cfg = layer.getConfig();
        if (cfg.units) layerSizes.push(cfg.units);
    }
    return layerSizes;
}

export function getParameterCount(hiddenLayers = [64, 32]) {
    // Architecture: Input(9) -> hidden1 -> hidden2 -> ... -> Policy(9) + Value(1)
    const inputSize = 9;
    const policySize = 9;
    const valueSize = 1;
    let total = 0;
    let prev = inputSize;
    for (const neurons of hiddenLayers) {
        total += prev * neurons + neurons; // weights + bias
        prev = neurons;
    }
    total += prev * policySize + policySize; // policy head
    total += prev * valueSize + valueSize;   // value head
    return total;
}

export function disposeModel(model) {
    if (model) model.dispose();
}

/* ── Model export / import ─────────────────────────────────────── */

export function exportModelWeights(model, metadata = {}) {
    const layers = [];
    for (const layer of model.layers) {
        const w = layer.getWeights();
        if (w.length === 0) continue;
        layers.push({
            name: layer.name,
            shapes: w.map(t => t.shape),
            data: w.map(t => Array.from(t.dataSync()))
        });
    }
    return {
        version: 1,
        architecture: getModelInfo(model),
        layers,
        metadata: {
            date: new Date().toISOString(),
            ...metadata
        }
    };
}

export function importModelWeights(model, snapshot) {
    if (!snapshot || !snapshot.layers) {
        throw new Error('Invalid model snapshot');
    }
    const currentInfo = getModelInfo(model);
    const savedInfo = snapshot.architecture || [];
    const match = currentInfo.length === savedInfo.length &&
        currentInfo.every((n, i) => n === savedInfo[i]);
    if (!match) {
        throw new Error(
            `Architecture mismatch: current [${currentInfo.join(',')}] vs saved [${savedInfo.join(',')}]. Create a model with matching layers first.`
        );
    }

    let layerIdx = 0;
    for (const layer of model.layers) {
        const w = layer.getWeights();
        if (w.length === 0) continue;

        const saved = snapshot.layers.find(l => l.name === layer.name);
        if (!saved) {
            throw new Error(`Layer "${layer.name}" not found in snapshot`);
        }
        if (saved.shapes.length !== w.length) {
            throw new Error(`Layer "${layer.name}" weight count mismatch`);
        }

        const newWeights = saved.data.map((flat, i) => {
            return tf.tensor(flat, saved.shapes[i]);
        });
        layer.setWeights(newWeights);
    }
}
