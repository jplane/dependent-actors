const msRestAzure = require("@azure/ms-rest-js");
const msEventGrid = require("@azure/eventgrid");
const uuid = require('uuid').v4;
const moment = require("moment")

module.exports = async function (context) {

    const topicKey = process.env["HEARTBEAT_TOPIC_KEY"];
    const topicEndpoint = process.env["HEARTBEAT_TOPIC_ENDPOINT"];
    
    const topicCreds = new msRestAzure.TopicCredentials(topicKey);
    const egClient = new msEventGrid.EventGridClient(topicCreds);

    const events = [
        {
            id: uuid(),
            subject: 'Heartbeat',
            dataVersion: '1.0',
            eventType: 'Kroger.DDR.Heartbeat',
            eventTime: moment.utc().format(),
            data: {}
        }
    ];

    await egClient.publishEvents(topicEndpoint, events)
                  .catch(err => {
                      console.error("Error publishing to event grid topic: " + err)
                  });
};
