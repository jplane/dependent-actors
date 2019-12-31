const df = require("durable-functions");

module.exports = async function (context, req) {

    const actorProxy = df.getClient(context);

    const category = context.bindingData.category;
    const target = context.bindingData.target;
    const query = context.bindingData.query;

    let result = null;

    if (category === "program") {
        result = await onProgramQuery(target, query, actorProxy);
    }

    return {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
        body: result
    };
};

async function onProgramQuery(program, query, actorProxy) {

    switch(query) {
        case "state":
            const programEntityId = new df.EntityId("ProgramActor", program);
            const response = await actorProxy.readEntityState(programEntityId);
            return response.entityState;
    }
}
