#!/bin/sh

SUBSCRIPTION_ID=
REGION=
RESOURCE_GROUP=
STORAGE_ACCOUNT_NAME=
PROGRAM_TOPIC_NAME=


az eventgrid topic create \
    --name $PROGRAM_TOPIC_NAME \
    -l $REGION \
    -g $RESOURCE_GROUP

endpoint=$(az eventgrid topic show --name $PROGRAM_TOPIC_NAME -g $RESOURCE_GROUP --query "endpoint" --output tsv)
echo "Program topic endpoint: $endpoint"

key=$(az eventgrid topic key list --name $PROGRAM_TOPIC_NAME -g $RESOURCE_GROUP --query "key1" --output tsv)
echo "Program topic key: $key"


az storage queue create --name ProgramDependenciesQueue --account-name $STORAGE_ACCOUNT_NAME

storageid=$(az storage account show --name $STORAGE_ACCOUNT_NAME --resource-group $RESOURCE_GROUP --query id --output tsv)
queueid="$storageid/queueservices/default/queues/ProgramDependenciesQueue"
topicid=$(az eventgrid topic show --name $PROGRAM_TOPIC_NAME -g $RESOURCE_GROUP --query id --output tsv)

az eventgrid event-subscription create \
  --source-resource-id $topicid \
  --name ProgramDependenciesQueueSubscription \
  --endpoint-type storagequeue \
  --endpoint $queueid
