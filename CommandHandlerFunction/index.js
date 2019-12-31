const df = require("durable-functions");
const moment = require("moment")

module.exports = async function (context, req) {

    const actorProxy = df.getClient(context);

    const category = context.bindingData.category;
    const target = context.bindingData.target;
    const command = context.bindingData.command;

    if (category === "program") {
        await onProgramCommand(target, command, actorProxy);
    }
};

async function onProgramCommand(program, command, actorProxy) {

    const timestamp = moment.utc().format();

    switch(command) {
        case "invoke":
            await signalInvoke(program, actorProxy, timestamp);
            break;
        case "reset":
            await signalReset(program, actorProxy, timestamp);
            break;
        case "enable":
            await signalEnableDisable(program, actorProxy, timestamp, true);
            break;
        case "disable":
            await signalEnableDisable(program, actorProxy, timestamp, false);
            break;
    }
}

async function signalEnableDisable(program, actorProxy, timestamp, enable) {
    await signalProgram(program,
                        enable ? "enable" : "disable",
                        { "eventTime": timestamp },
                        actorProxy);
}

async function signalInvoke(program, actorProxy, timestamp) {
    await signalProgram(program, "invoke", { "eventTime": timestamp }, actorProxy);
}

async function signalReset(program, actorProxy, timestamp) {
    await signalProgram(program, "reset", { "eventTime": timestamp }, actorProxy);
}

async function signalProgram(program, operation, arg, actorProxy) {
    const programEntityId = new df.EntityId("ProgramActor", program);
    await actorProxy.signalEntity(programEntityId, operation, arg);
}
