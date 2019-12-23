const df = require("durable-functions");
const d2pMap = require("../ProgramDependencyMapping").d2pMap;
const p2dMap = require("../ProgramDependencyMapping").p2dMap; 

module.exports = async function (context, req) {

    const actorProxy = df.getClient(context);

    await req.body.forEach(async evt => {

        switch(evt.eventType) {
            case "Microsoft.EventGrid.SubscriptionValidationEvent":
                handleEventGridSubscriptionValidation(context, evt);
                break;
            case "Microsoft.Storage.BlobCreated":
                await signalFileDependencyActor(evt, actorProxy);
                break;
            case "Kroger.DDR.Heartbeat":
                await signalHeartbeat(evt, actorProxy);
                break;
            case "Kroger.DDR.ManualInvokeProgram":
                await signalManualInvoke(evt, actorProxy);
                break;
            case "Kroger.DDR.ResetProgram":
                await signalReset(evt, actorProxy);
                break;
            case "Kroger.DDR.EnableProgram":
                await signalEnableDisable(evt, actorProxy, true);
                break;
            case "Kroger.DDR.DisableProgram":
                await signalEnableDisable(evt, actorProxy, false);
                break;
        }
    });

    context.done();
};

function handleEventGridSubscriptionValidation(context, evt) {
    var code = evt.data.validationCode;
    context.res = { status: 200, body: { "ValidationResponse": code } };
}

async function signalEnableDisable(evt, actorProxy, enable) {
    await signalProgram(evt.data.program,
                        enable ? "enable" : "disable",
                        { "timestamp": evt.eventTime },
                        actorProxy);
}

async function signalManualInvoke(evt, actorProxy) {
    await signalProgram(evt.data.program, "manualInvoke", { "timestamp": evt.eventTime }, actorProxy);
}

async function signalReset(evt, actorProxy) {
    await signalProgram(evt.data.program, "reset", { "timestamp": evt.eventTime }, actorProxy);
}

async function signalProgram(program, operation, arg, actorProxy) {
    const programEntityId = new df.EntityId("ProgramActor", program);
    await actorProxy.signalEntity(programEntityId, operation, arg);
}

async function signalHeartbeat(evt, actorProxy) {
    p2dMap.forEach(async item => {
        const programEntityId = new df.EntityId("ProgramActor", item.program);
        await actorProxy.signalEntity(programEntityId, "heartbeatEvent", evt);
    });
}

async function signalFileDependencyActor(evt, actorProxy) {

    const evtUrl = evt.data.url;

    const actor = d2pMap.find(item => item.dependency.type === "file" &&
                                      evtUrl.endsWith(item.dependency.key));

    if (!actor) {
        console.error("No registered dependency found for this file event.");
        return;
    }

    const id = toBase64(actor.dependency.type + ":" + actor.dependency.key);

    const entityId = new df.EntityId("DependencyActor", id);
    
    await actorProxy.signalEntity(entityId, "fileEvent", evt);
}

function toBase64(str) {
    return Buffer.from(str).toString('base64');
}
