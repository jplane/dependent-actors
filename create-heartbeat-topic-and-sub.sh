#!/bin/sh

SUBSCRIPTION_ID=
RESOURCE_GROUP=
REGION=
HEARTBEAT_TOPIC_NAME=
EVENT_ROUTER_URL=


az eventgrid topic create \
    --name $HEARTBEAT_TOPIC_NAME \
    -l $REGION \
    -g $RESOURCE_GROUP

endpoint=$(az eventgrid topic show --name $HEARTBEAT_TOPIC_NAME -g $RESOURCE_GROUP --query "endpoint" --output tsv)
echo "Heartbeat topic endpoint: $endpoint"

key=$(az eventgrid topic key list --name $HEARTBEAT_TOPIC_NAME -g $RESOURCE_GROUP --query "key1" --output tsv)
echo "Heartbeat topic key: $key"


az eventgrid event-subscription create \
  --source-resource-id "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.EventGrid/topics/$HEARTBEAT_TOPIC_NAME" 
  --name EventRouterHeartbeatSubscription
  --endpoint $EVENT_ROUTER_URL
