const df = require("durable-functions");
const d2pMap = require("../ProgramDependencyMapping").d2pMap;

module.exports = df.entity(function(context) {

    switch (context.df.operationName) {
        case "fileEvent":
            onFileEvent(context);
            break;
    }
});

function onFileEvent(context) {

    const entityId = fromBase64(context.df.entityId.key);

    const type = entityId.split(":")[0];

    const key = entityId.split(":")[1];

    const evt = context.df.getInput();

    let programs = context.df.getState(() => []);

    if (context.df.isNewlyConstructed) {

        const idx = d2pMap.findIndex(item => item.dependency.type === type &&
                                             item.dependency.key === key);

        if (idx === -1) {
            throw `No registered dependency found for dependency type '${type}' and key '${key}.'`
        }

        programs = d2pMap[idx].programs;

        context.df.setState(programs);
    }

    programs.forEach(program => {
        const programEntityId = new df.EntityId("ProgramActor", program);
        context.df.signalEntity(programEntityId, "fileEvent", evt)        
    });
}

function fromBase64(base64Str) {
    return Buffer.from(base64Str, 'base64').toString('ascii');
}
