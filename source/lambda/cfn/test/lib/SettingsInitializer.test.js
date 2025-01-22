/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const originalEnv = process.env;
const SettingsInitializer = require('../../lib/SettingsInitializer');
const SettingsInitializerFixture = require('./SettingsInitializer.fixtures');
const { mockClient } = require('aws-sdk-client-mock');
const { marshall } = require('@aws-sdk/util-dynamodb');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const DynamoDBClientMock = mockClient(DynamoDBClient);
const { SSMClient, DescribeParametersCommand, GetParameterCommand } = require('@aws-sdk/client-ssm');
const SSMClientMock = mockClient(SSMClient);

function initializePrivateSettings(parameterSubset) {
    const params = SettingsInitializerFixture.SettingsInitializerObject();
    const settings = {};
    
    parameterSubset.forEach(key => {
        settings[key] = {
            SettingName: key,
            SettingValue: params[key],
            SettingCategory: "Private",
            nonce: 0
        };
    });
    
    return settings;
}


describe('test SettingsInitializer class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };
        SSMClientMock.reset();
        DynamoDBClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("Should run AsyncCreate", async () => {
        const settingsInitializerCut = new SettingsInitializer();
        const params = SettingsInitializerFixture.SettingsInitializerObject();

        const callback = (error, result) => {
        };

        await settingsInitializerCut.Create('fakeID', params, callback);
    });  

    it("Should check SSM when SSM parameters exist", async () => {
        const settingsInitializerCut = new SettingsInitializer();
        const params = SettingsInitializerFixture.SettingsInitializerObject();

        SSMClientMock.on(DescribeParametersCommand).resolves({
            Parameters: [
                {
                    Name: 'CFN-CustomQnABotSettings',
                    Type: 'String',
                    LastModifiedDate: new Date(),
                    Version: 1,
                    ValueType: 'string',
                    KeyId: 'alias/aws/ssm',
                    LastModifiedUser: 'XXXXXXXXX',
                    Description: 'mock_description',
                    Tier: 'Standard'
                }
            ]
        });

        SSMClientMock.on(DescribeParametersCommand).resolves({
            Parameters: [
                {
                    Name: 'CFN-PrivateQnABotSettings',
                    Type: 'String',
                    LastModifiedDate: new Date(),
                    Version: 1,
                    ValueType: 'string',
                    KeyId: 'alias/aws/ssm',
                    LastModifiedUser: 'XXXXXXXXX',
                    Description: 'mock_description',
                    Tier: 'Standard'
                }
            ]
        })

        SSMClientMock.on(GetParameterCommand, {Name: 'CFN-CustomQnABotSettings', WithDecryption: true}).resolves({
            Parameter: {
                Name: 'CFN-CustomQnABotSettings',
                Type: 'String',
                Value: '{"FakeCustomParameter":"FakeValue"}',
                Version: 1,
                LastModifiedUser: 'XXXXXXXXX',
                LastModifiedDate: new Date(),
                ARN: 'XXXXXXXXX',
                DataType: 'text'
            }
        });
        
        SSMClientMock.on(GetParameterCommand, {Name: 'CFN-PrivateQnABotSettings', WithDecryption: true}).resolves({
            Parameter: {
                Name: 'CFN-CustomQnABotSettings',
                Type: 'String',
                Value: '{"FakePrivateParameter":"FakeValue"}',
                Version: 1,
                LastModifiedUser: 'XXXXXXXXX',
                LastModifiedDate: new Date(),
                ARN: 'XXXXXXXXX',
                DataType: 'text'
            }
        });

        let privateSettingsSubset = ['EMBEDDINGS_MODEL_ID','LLM_MODEL_ID','KNOWLEDGE_BASE_MODEL_ID','KNOWLEDGE_BASE_ID','LLM_API','NATIVE_LANGUAGE','ALT_SEARCH_KENDRA_INDEXES','ALT_SEARCH_KENDRA_INDEX_AUTH','KENDRA_FAQ_INDEX','KENDRA_WEB_PAGE_INDEX']

        let privateSettings = initializePrivateSettings(privateSettingsSubset);

        let customItem = {
            SettingName: "FakeCustomParameter",
            SettingValue: "FakeValue",
            SettingCategory: "Custom",
            nonce: 0
        };

        privateSettingsSubset.forEach(settingName => {
            console.log(privateSettings[settingName])
            DynamoDBClientMock.on(PutItemCommand, {TableName: params.SettingsTable, Item: marshall(privateSettings[settingName])}).resolves({})
        })
        
        DynamoDBClientMock.on(PutItemCommand, {TableName: params.SettingsTable, Item: marshall(customItem)}).resolves({})

        const callback = (error, result) => {
        };

        await settingsInitializerCut.Create(params, callback);
    });

    it("Should run AsyncUpdate", async () => {
        const settingsInitializerCut = new SettingsInitializer();
        const params = SettingsInitializerFixture.SettingsInitializerObject();

        const callback = (error, result) => {
        };

        await settingsInitializerCut.Update('fakeID', params, null, callback);
    });
});