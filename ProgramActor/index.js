const df = require("durable-functions");
const msRestAzure = require("@azure/ms-rest-js");
const msEventGrid = require("@azure/eventgrid");
const uuid = require('uuid').v4;
const p2dMap = require("../ProgramDependencyMapping").p2dMap; 
const moment = require("moment")

module.exports = df.entity(async function(context) {

    const evt =  context.df.getInput();

    let state = context.df.getState(() => getInitialState(context, evt.timestamp));
    
    switch (context.df.operationName) {
        case "fileEvent":
            state = await onFileEvent(context, state, evt);
            break;
        case "heartbeatEvent":
            state = await onHeartbeatEvent(context, state, evt);
            break;
        case "manualInvoke":
            state = await onManualInvokeEvent(context, state, evt);
            break;
        case "reset":
            state = getInitialState(context, evt.timestamp);
            break;
        case "enable":
            state.enabled = true;
            break;
        case "disable":
            state.enabled = false;
            break;
    }

    context.df.setState(state);
});

async function onManualInvokeEvent(context, state, evt) {

    if (!state.enabled) {
        return state;
    }

    return await publishEvent(context, state, evt);
}

async function onFileEvent(context, state, evt) {

    if (!state.enabled) {
        return state;
    }

    const dep = state.dependencies.find(dep => dep.type === evt.type && dep.key === evt.key);

    if (!dep) {
        console.error(`No registered dependency of type '${dep.type}' and key '${dep.key}' for program '${state.program}'.`);
    } else {
        dep.arrivals.push(evt.timestamp);
        state = await checkDependenciesSatisfied(context, state, evt);
    }

    return state;
}

async function onHeartbeatEvent(context, state, evt) {

    if (!state.enabled) {
        return state;
    }

    const first = state.first;
    const now = moment(evt.timestamp);
    const elapsed = moment.duration(now.diff(first));

    state.last = now;

    let reset = false;

    switch(state.waitInterval) {
        
        case "hour":
            reset = elapsed.minutes() >= 60;
            break;

        case "day":
            reset = elapsed.hours() >= 24;
            break;

        case "week":
            reset = elapsed.days() >= 7;
            break;
    }

    if (reset) {
        state = getInitialState(context, evt.timestamp);
    }
    
    return state;
}

async function checkDependenciesSatisfied(context, state, evt) {

    const totalSatisfied = state.dependencies.reduce(
        (accum, curr) => curr.arrivals.length > 0 ? accum + 1 : accum, 0);

    if (totalSatisfied === state.dependencies.length) {
        state = await publishEvent(context, state, evt);
    }

    return state;
}

async function publishEvent(context, state, evt) {

    const topicKey = process.env["PROGRAM_TOPIC_KEY"];
    const topicEndpoint = process.env["PROGRAM_TOPIC_ENDPOINT"];
    
    const topicCreds = new msRestAzure.TopicCredentials(topicKey);
    const egClient = new msEventGrid.EventGridClient(topicCreds);

    const events = [
        {
            id: uuid(),
            subject: `Program '${state.program} dependencies satisfied.`,
            dataVersion: '1.0',
            eventType: 'Kroger.DDR.ProgramDependenciesSatisfied',
            eventTime: moment.utc().format(),
            data: {
                programType: `${state.program}`
            }
        }
    ];

    await egClient.publishEvents(topicEndpoint, events)
                  .then(_ => {
                      state = getInitialState(context, evt.timestamp);
                  })
                  .catch(err => {
                      console.error("Error publishing to event grid topic: " + err);
                  });

    return state;
}

function getInitialState(context, now) {

    const programType = context.df.entityId.key;
    
    const map = p2dMap.find(item => item.program === programType);
    
    if (!map) {
        console.error(`No registered dependencies found for program type '${programType}.'`);
        return null;
    } else {
        return {
            "program": map.program,
            "enabled": true,
            "waitInterval": map.waitInterval,
            "first": moment(now),
            "last": moment(now),
            "dependencies": map.dependencies.map(dep => {
                dep.arrivals = [];
                return dep;
            })
        };    
    }
}
