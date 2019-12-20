const df = require("durable-functions");
const d2pMap = require("../ProgramDependencyMapping").d2pMap;

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
        }
    });

    context.done();
};

function handleEventGridSubscriptionValidation(context, evt) {
    var code = evt.data.validationCode;
    context.res = { status: 200, body: { "ValidationResponse": code } };
}

async function signalFileDependencyActor(evt, actorProxy) {

    const evtUrl = evt.data.url;

    const actor = d2pMap.find(item => item.dependency.type === "file" &&
                                      evtUrl.endsWith(item.dependency.key));

    if (!actor) {
        throw "No registered dependency found for this file event."
    }

    const id = toBase64(actor.dependency.type + ":" + actor.dependency.key);

    const entityId = new df.EntityId("DependencyActor", id);
    
    await actorProxy.signalEntity(entityId, "fileEvent", evt);
}

function toBase64(str) {
    return Buffer.from(str).toString('base64');
}
