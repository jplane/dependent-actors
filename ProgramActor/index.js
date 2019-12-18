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
    // add new satisifed dependency
    // check if all dependencies satisified
    // if yes, then publish "program dependencies satisified" event
}

function onTimerEvent(state, input) {

}

function getDefaultState(programType) {

}
