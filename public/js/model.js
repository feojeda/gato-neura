import { PLAYER_X, isTerminal } from './game.js';

export function createModel(hiddenLayers = [64, 32]) {
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

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: ['categoricalCrossentropy', 'meanSquaredError']
    });

    return model;
}

export async function predict(model, board) {
    const input = tf.tensor2d([board]);
    const [policyTensor, valueTensor] = model.predict(input);
    const policy = await policyTensor.array();
    const value = (await valueTensor.array())[0][0];
    input.dispose();
    policyTensor.dispose();
    valueTensor.dispose();
    return { policy: policy[0], value };
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
    const layerSizes = [9];
    for (const layer of model.layers) {
        const cfg = layer.getConfig();
        if (cfg.units) layerSizes.push(cfg.units);
    }
    return layerSizes;
}

export function disposeModel(model) {
    if (model) model.dispose();
}
