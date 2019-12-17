const df = require("durable-functions");

module.exports = df.entity(function(context) {

    const input = context.df.getInput();

    const programType = input.programType;
    const instanceId = input.instanceId;

    const state = context.df.getState(getDefaultState(programType));
    
    switch (context.df.operationName) {
        case "datasetEvent":
            onDatasetEvent(state, input);
            break;
        case "timerEvent":
            onTimerEvent(state, input);
            break;
    }
});

function onDatasetEvent(state, input) {

}

function onTimerEvent(state, input) {

}

function getDefaultState(programType) {

}
