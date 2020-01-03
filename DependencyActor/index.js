const df = require("durable-functions");
const d2pMap = (require("../ProgramDependencyMapping").d2pMap)();

module.exports = df.entity(function(context) {

    const evt =  context.df.getInput();

    switch (context.df.operationName) {
        case "fileEvent":
            onFileEvent(context, evt);
            break;
    }
});

function onFileEvent(context, evt) {

    const entityId = fromBase64(context.df.entityId.key);

    const type = entityId.split(":")[0];

    const key = entityId.split(":")[1];

    let programs = context.df.getState(() => []);

    if (context.df.isNewlyConstructed) {

        const idx = d2pMap.findIndex(item => item.dependency.type === type &&
                                             item.dependency.key === key);

        if (idx === -1) {
            console.error(`No registered dependency found for dependency type '${type}' and key '${key}.'`);
            return;
        }

        programs = d2pMap[idx].programs;

        context.df.setState(programs);
    }

    evt = {
        "type": type,
        "key": key,
        "eventTime": evt.eventTime
    };

    programs.forEach(program => {
        const programEntityId = new df.EntityId("ProgramActor", program);
        context.df.signalEntity(programEntityId, "fileEvent", evt);
    });
}

function fromBase64(base64Str) {
    return Buffer.from(base64Str, 'base64').toString('ascii');
}
