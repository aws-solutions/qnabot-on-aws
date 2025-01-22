/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { DynamoDBClient, PutItemCommand, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { SSMClient, GetParameterCommand, DeleteParameterCommand ,DescribeParametersCommand } = require('@aws-sdk/client-ssm');
const { marshall } = require('@aws-sdk/util-dynamodb');
const customSdkConfig = require('./util/customSdkConfig');
const settingsJson = require('./DefaultSettings.json');

const region = process.env.AWS_REGION || 'us-east-1';
const dynamodb = new DynamoDBClient(customSdkConfig({ region }));
const ssm = new SSMClient(customSdkConfig({ region }));

async function updateDefaultSettingsFromParams(params, tableName) {
    // This function writes default settings based on the parameters that were passed in on template creation/update

    let existingDefaultSettings = {
        ES_USE_KEYWORD_FILTERS: params.ES_USE_KEYWORD_FILTERS,
        EMBEDDINGS_ENABLE: params.EMBEDDINGS_ENABLE,
        EMBEDDINGS_MAX_TOKEN_LIMIT: params.EMBEDDINGS_MAX_TOKEN_LIMIT,
        EMBEDDINGS_SCORE_THRESHOLD: params.EMBEDDINGS_SCORE_THRESHOLD,
        EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD: params.EMBEDDINGS_TEXT_PASSAGE_SCORE_THRESHOLD,
        LLM_GENERATE_QUERY_ENABLE: params.LLM_GENERATE_QUERY_ENABLE,
        LLM_QA_ENABLE: params.LLM_QA_ENABLE,
        LLM_GENERATE_QUERY_PROMPT_TEMPLATE: params.LLM_GENERATE_QUERY_PROMPT_TEMPLATE,
        LLM_GENERATE_QUERY_SYSTEM_PROMPT: params.LLM_GENERATE_QUERY_SYSTEM_PROMPT,
        LLM_QA_PROMPT_TEMPLATE: params.LLM_QA_PROMPT_TEMPLATE,
        LLM_QA_SYSTEM_PROMPT: params.LLM_QA_SYSTEM_PROMPT,
        LLM_GENERATE_QUERY_MODEL_PARAMS: params.LLM_GENERATE_QUERY_MODEL_PARAMS,
        LLM_QA_MODEL_PARAMS: params.LLM_QA_MODEL_PARAMS,
        LLM_PROMPT_MAX_TOKEN_LIMIT: params.LLM_PROMPT_MAX_TOKEN_LIMIT,
        LLM_QA_NO_HITS_REGEX: params.LLM_QA_NO_HITS_REGEX,
        KNOWLEDGE_BASE_PROMPT_TEMPLATE: params.KNOWLEDGE_BASE_PROMPT_TEMPLATE,
        LLM_STREAMING_ENABLED: params.LLM_STREAMING_ENABLED,
        STREAMING_TABLE: params.STREAMING_TABLE
    }

    Object.entries(existingDefaultSettings).forEach(async ([key, value]) => {
        try {
            const updateParams = {
                TableName: tableName,
                Key: marshall({ SettingName: key }),
                UpdateExpression: 'SET DefaultValue = :val',
                ExpressionAttributeValues: marshall({ ':val': value })
            };
            const updateCommand = new UpdateItemCommand(updateParams);
            await dynamodb.send(updateCommand);
        } catch(error) {
            throw new Error(`Error updating default settings from params: ${error}`);
        }
    });
}

async function updatePrivateSettings(params, tableName, writePrivateSettings) {
    let existingPrivateSettings = {
        EMBEDDINGS_MODEL_ID: params.EMBEDDINGS_MODEL_ID,
        LLM_MODEL_ID: params.LLM_MODEL_ID,
        KNOWLEDGE_BASE_MODEL_ID: params.KNOWLEDGE_BASE_MODEL_ID,
        KNOWLEDGE_BASE_ID: params.KNOWLEDGE_BASE_ID,
        LLM_API: params.LLM_API,
        NATIVE_LANGUAGE: params.NATIVE_LANGUAGE,
        ALT_SEARCH_KENDRA_INDEXES: params.ALT_SEARCH_KENDRA_INDEXES,
        ALT_SEARCH_KENDRA_INDEX_AUTH: params.ALT_SEARCH_KENDRA_INDEX_AUTH,
        KENDRA_FAQ_INDEX: params.KENDRA_FAQ_INDEX,
        KENDRA_WEB_PAGE_INDEX: params.KENDRA_WEB_PAGE_INDEX
    }

    Object.entries(existingPrivateSettings).forEach(async ([key, value]) => {
        try {
            if (writePrivateSettings) {
                const item = {
                    SettingName: key,
                    SettingValue: value,
                    SettingCategory: "Private",
                    DefaultValue: settingsJson[key]?.DefaultValue || "",
                    nonce: 0
                };

                const putParams = {
                    TableName: tableName,
                    Item: marshall(item)
                };

                const putCommand = new PutItemCommand(putParams);
                await dynamodb.send(putCommand);
            }
            else {
                const updateParams = {
                    TableName: tableName,
                    Key: marshall({ SettingName: key }),
                    UpdateExpression: 'SET SettingValue = :val',
                    ExpressionAttributeValues: marshall({ ':val': value })
                };
                const updateCommand = new UpdateItemCommand(updateParams);
                await dynamodb.send(updateCommand);
            }
        }
        catch(error) {
            throw new Error(`Error updating private settings: ${writePrivateSettings} ${error} ${key} ${value}`);
        }
    });

}

async function writeSettingsToDynamoDB(tableName, settings) {
    const writePromises = [];  // Create array to collect promises

    Object.entries(settings).forEach(([settingName, valueAndCategory]) => {
        try {
            const { SettingCategory, DefaultValue } = valueAndCategory;

            const item = {
                SettingName: settingName,
                SettingValue: "",
                SettingCategory: SettingCategory,
                DefaultValue: DefaultValue,
                nonce: 0
            };

            const putParams = {
                TableName: tableName,
                Item: marshall(item)
            };

            const putCommand = new PutItemCommand(putParams);
            // Push the promise into the array
            writePromises.push(dynamodb.send(putCommand));
        }
        catch(error) {
            throw new Error(`Error writing settings to DynamoDB: ${error}`);
        }
    });

    await Promise.all(writePromises);  // Wait for all promises to resolve
}

async function addNewSettings(tableName, defaultSettings) {
    for (const [settingName, valueAndCategory] of Object.entries(defaultSettings)) {
        try {
            const getParams = {
                TableName: tableName,
                Key: marshall({ SettingName: settingName })
            };
            const getCommand = new GetItemCommand(getParams);
            const getResult = await dynamodb.send(getCommand);

            if (!getResult.Item) {
                console.log(`Adding new setting: ${settingName}`);
                const item = {
                    SettingName: settingName,
                    SettingValue: "",
                    SettingCategory: valueAndCategory.SettingCategory,
                    DefaultValue: valueAndCategory.DefaultValue,
                    nonce: 0
                };

                const putParams = {
                    TableName: tableName,
                    Item: marshall(item)
                };

                const putCommand = new PutItemCommand(putParams);
                await dynamodb.send(putCommand);

                }
            } catch (error) {
                throw new Error(`Error adding new settings: ${error}`);
            }
        }
}


async function migrateFromSSM(tableName, ssmParameters) {
    for (const ssmParameter of ssmParameters) {
        const getParams = {
            Name: ssmParameter,
            WithDecryption: true
        };
        const getCommand = new GetParameterCommand(getParams);
        const getResponse = await ssm.send(getCommand);
        const ssmValue = JSON.parse(getResponse.Parameter.Value);
        try {
            for (const [key,value] of Object.entries(ssmValue)) {
                if (ssmParameter.includes('PrivateQnABotSettings')) {
                        const item = {
                            SettingName: key,
                            SettingValue: value,
                            SettingCategory: "Private",
                            DefaultValue: settingsJson[key]?.DefaultValue || "",
                            nonce: 0
                        };

                        const putParams = {
                            TableName: tableName,
                            Item: marshall(item)
                        };

                        const putCommand = new PutItemCommand(putParams);
                        await dynamodb.send(putCommand);
                } else if(ssmParameter.includes('CustomQnABotSettings')) {
                        if (settingsJson[key]) {
                            const updateParams = {
                                TableName: tableName,
                                Key: marshall({ SettingName: key }),
                                UpdateExpression: 'SET SettingValue = :val',
                                ExpressionAttributeValues: marshall({ ':val': value })
                            };
                            const updateCommand = new UpdateItemCommand(updateParams);
                            await dynamodb.send(updateCommand);
                        } else {
                                const item = {
                                SettingName: key,
                                SettingValue: value,
                                SettingCategory: "Custom",
                                nonce: 0
                                };

                                const putParams = {
                                TableName: tableName,
                                Item: marshall(item)
                                };

                                const putCommand = new PutItemCommand(putParams);
                                await dynamodb.send(putCommand);
                        }
                }
            }
            const deleteParams = {
                Name: ssmParameter
            };
            const deleteCommand = new DeleteParameterCommand(deleteParams)
            await ssm.send(deleteCommand);
        }
        catch(error) {
            throw new Error(`Error migrating from SSM: ${error}`);
        }

    }
}

async function getSSMParameters() {
    const prefixes = [
        'CFN-CustomQnABotSettings',
        'CFN-DefaultQnABotSettings',
        'CFN-PrivateQnABotSettings'
    ];

    let ssmParameters = []

    for (const prefix of prefixes) {
        const describeParams = {
            ParameterFilters: [
                {
                    Key: "Name",
                    Option: "BeginsWith",
                    Values: [prefix]
                }
            ],
            MaxResults: 1
        };
        const describeCommand = new DescribeParametersCommand(describeParams);
        const describeResponse = await ssm.send(describeCommand);

        if (describeResponse.Parameters.length > 0) {
            ssmParameters = ssmParameters.concat(describeResponse.Parameters[0].Name);
        }
    }

    return ssmParameters;
}



module.exports = class SettingsInitializer {

    async Create(params, reply) {
        try {
            const { SettingsTable } = params;
            let writePrivateSettings = true;
            // Initialize settings (will only add new settings if table is not empty)
            await writeSettingsToDynamoDB(SettingsTable, settingsJson);
            const ssmParameters = await getSSMParameters();

            if (ssmParameters.length > 0) {
                console.log('Legacy SSM parameters found. Performing migration from SSM to DynamoDB');
                await migrateFromSSM(SettingsTable, ssmParameters);
                writePrivateSettings = false
            } 

            await updatePrivateSettings(params, SettingsTable, writePrivateSettings);
            console.log('Added Private Settings')
            await updateDefaultSettingsFromParams(params, SettingsTable);
            console.log('Added default settings from params')
            reply(null, SettingsTable, { FnGetAttrsDataObj: { Settings: "Created" } });
        } catch (error) {
            console.error('Error initializing settings table:', error);            
        }
    }

    async Update(ID, params, old_params, reply) {
        try {
            const { SettingsTable } = params;

            // Add any new settings
            await addNewSettings(SettingsTable, settingsJson);

            console.log('Successfully updated settings');

            await updatePrivateSettings(params, SettingsTable, true);
            console.log('Added Private Settings')
            await updateDefaultSettingsFromParams(params, SettingsTable);
            console.log('Added default settings from params');
            reply(null, ID, { FnGetAttrsDataObj: { Settings: "Updated" } });

        } catch (error) {
            console.error('Error updating settings:', error);
        }
    }

    async Delete(ID, params, reply) {
        reply(null, ID, { FnGetAttrsDataObj: { Settings: "Deleted" } });
    }
}


