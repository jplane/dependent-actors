const msRestAzure = require("@azure/ms-rest-js");
const msEventGrid = require("@azure/eventgrid");
const uuid = require('uuid').v4;
const moment = require("moment");
const axios = require('axios');

module.exports = async function (context) {

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

    const isLocal = process.env["LOCAL"] === "true";

    if (isLocal) {

        // if running locally, we'll just POST directly to the event router func

        await axios({
            method: "post",
            url: "http://localhost:7071/api/events",
            data: events
        });

    } else {

        // if running in the cloud, we'll publish heartbeat events which will
        //  be picked up by the event router func via registered event grid subscription

        const topicKey = process.env["HEARTBEAT_TOPIC_KEY"];
        const topicEndpoint = process.env["HEARTBEAT_TOPIC_ENDPOINT"];
        
        const topicCreds = new msRestAzure.TopicCredentials(topicKey);
        const egClient = new msEventGrid.EventGridClient(topicCreds);
    
        await egClient.publishEvents(topicEndpoint, events)
                      .catch(err => {
                          console.error("Error publishing to event grid topic: " + err)
                      });
    }
};
