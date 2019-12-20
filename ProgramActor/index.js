const df = require("durable-functions");
const EventGridClient = require("azure-eventgrid");
const msRestAzure = require('ms-rest-azure');
const uuid = require('uuid').v4;
const p2dMap = require("../ProgramDependencyMapping").p2dMap; 

module.exports = df.entity(function(context) {

    const evt = context.df.getInput();

    const programType = context.df.entityId.key;

    const state = context.df.getState(() => {
        const map = p2dMap.find(item => item.program === programType);
        return {
            "map": map,
            "satisfiedCount": 0
        };
    });

    if (!state) {
        throw `No registered program found for program type '${programType}.'`
    }
    
    switch (context.df.operationName) {
        case "fileEvent":
            onFileEvent(context, state, evt);
            break;
        case "timerEvent":
            onTimerEvent(context, state, evt);
            break;
    }

    context.df.setState(state);
});

function onFileEvent(context, state, evt) {

    state.satisfiedCount += 1;

    if (state.map.dependencies.length === state.satisfiedCount) {

        const topicKey = process.env["TOPIC_KEY"];
        const topicEndpoint = process.env["TOPIC_ENDPOINT"];
        const subscriptionId = process.env["SUBSCRIPTION_ID"];
        
        const topicCreds = new msRestAzure.TopicCredentials(topicKey);

        const egClient = new EventGridClient(topicCreds);

        const events = [
            {
                id: uuid(),
                subject: `Program '${state.map.program} dependencies satisfied.`,
                dataVersion: '1.0',
                eventType: 'Kroger.DDR.ProgramDependenciesSatisfied',
                data: {
                    programType: `${state.map.program}`
                }
            }
        ];

        egClient.publishEvents(topicEndpoint, events)
                .then(_ => context.df.destructOnExit());
    }
}

function onTimerEvent(context, state, evt) {

}
