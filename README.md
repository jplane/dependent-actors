# DDR Actor Model Sample

DDR sample written in Javascript, supports multiple programs with file-based dependencies, as defined [here](ProgramDependencyMapping.js).

Individual programs are represented as actors that keep track of their own state, using the [durable entities](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-entities) feature of [Azure Durable Functions 2.0](https://docs.microsoft.com/en-us/azure/azure-functions/durable/durable-functions-versions). Dependencies are represented as Azure Event Grid events.

## Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/) (other editors may work but haven't been tested)
- [Azure Functions Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local)
- [.NET Core 2.x SDK](https://dotnet.microsoft.com/download/dotnet-core/2.2) (note this is only for the Az Funcs Core Tools... no application code is written in .NET)
- [VS Code Azure Functions extension](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-azurefunctions)
- [Node.js](https://nodejs.org/en/)

## To run locally
- create a local.settings.json file from [local.settings.json.template](local.settings.json.template)
- [create a custom Event Grid topic](https://docs.microsoft.com/en-us/azure/event-grid/scripts/event-grid-cli-create-custom-topic) for programs to post events when their dependencies have been met. Use a topic name like 'program-topic' or similar.
- update your local settings with the program topic key and endpoint values
- (you may ignore heartbeat topic key/endpoint for local debugging)
- run the Function app inside the VS Code debugger, and use the [sample Postman requests](DDR.postman_collection.json) to interact with it
- DEBUGGING TIP: [register an Azure queue to subscribe to program topic events](https://docs.microsoft.com/en-us/azure/event-grid/custom-event-to-queue-storage) in order to view them as they're produced