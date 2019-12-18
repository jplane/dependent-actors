const df = require("durable-functions");

module.exports = async function (context) {

    const instanceId = context.req.params.instanceId;

    const actorProxy = df.getClient(context);

    const entityId = new df.EntityId("CounterActor", instanceId);
    
    await actorProxy.signalEntity(entityId, "add", 1);

    return actorProxy.createCheckStatusResponse(context.req, instanceId);
};
