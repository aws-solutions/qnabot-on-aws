/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import settingsModule from '../../../../../js/lib/store/api/actions/settings';

const awsMock = require('aws-sdk-client-mock');
const { DynamoDBClient, DeleteItemCommand, GetItemCommand, PutItemCommand, ScanCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const dynamodbMock = awsMock.mockClient(DynamoDBClient);

describe('settings action', () => {
    beforeEach(() => {
        dynamodbMock.reset();
    });

    test('listSettings', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: 'mockedValue',
                    DefaultQnABotSettings: 'mockedValue',
                    PrivateQnABotSettings: 'mockedValue',
                    SettingsTable: 'mockedTableName'
                },

            },
        };
        dynamodbMock.on(ScanCommand).resolves({ Items: [{"SettingCategory":{"S":"Advanced"},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"ES_PHRASE_BOOST"}}] })
        const result = await settingsModule.listSettings(mockedContext);
        expect(result).toEqual([{ES_PHRASE_BOOST:4}, {}, {ES_PHRASE_BOOST:4}]);
    });

    test('listSettings -- error thrown', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: {},
                    DefaultQnABotSettings: {},
                    SettingsTable: 'mockedTableName'
                },
            },
        };
        dynamodbMock.on(ScanCommand).rejects('mocked rejection');
        await expect(settingsModule.listSettings(mockedContext)).rejects.toThrow('mocked rejection');
    });

    test('Update and Restore Settings', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: {},
                    DefaultQnABotSettings: {},
                    SettingsTable: 'mockedTableName'
                },
            },
        };
        dynamodbMock.on(GetItemCommand).resolves({ Item: {"SettingCategory":{"S":"Advanced"},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"ES_PHRASE_BOOST"}} })
        dynamodbMock.on(UpdateItemCommand).resolves({ Attributes: { SettingName: { S: 'ES_PHRASE_BOOST' }, SettingValue: { N: 3 }, SettingCategory: { S: 'Advanced' }, DefaultValue: { N: '4' }, nonce: { N: '0' } } })
        // GetParameters shows that there's one setting left out of the new settings JSON that was just saved
        dynamodbMock.on(ScanCommand).resolves({ Items: [{"SettingCategory":{"S":"Advanced"}, "SettingValue": {"N":4},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"ES_PHRASE_BOOST"}}, {"SettingCategory":{"S":"Advanced"}, "SettingValue": {"N":4},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"LAMBDA_POSTPROCESS_HOOK"}}] })
        dynamodbMock.on(GetItemCommand, {TableName: mockedContext.rootState.info.SettingsTable, Key: {"SettingName": {"S": "LAMBDA_POSTPROCESS_HOOK"}, "SettingCategory": {"S": "Advanced"}}}).resolves({ Item: {"SettingCategory":{"S":"Advanced"},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"ES_PHRASE_BOOST"}} })
        const result = await settingsModule.updateSettings(mockedContext, { ES_PHRASE_BOOST: 3 });
        expect(result).toEqual({"changedSettings":["ES_PHRASE_BOOST",],"restoredSettings":["LAMBDA_POSTPROCESS_HOOK",]});
    });

    test('Update and Restore Custom Settings', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: {},
                    DefaultQnABotSettings: {},
                    SettingsTable: 'mockedTableName'
                },
            },
        };        
        dynamodbMock.on(GetItemCommand, {
            TableName: mockedContext.rootState.info.SettingsTable,
            Key: {
                SettingName: {"S":'Test1'},
                SettingCategory: {"S":'Custom'},
            },
        }).resolves({})
        dynamodbMock.on(GetItemCommand).resolves({ Item: {"SettingCategory":{"S":"Custom"},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"Test1"}} })
        dynamodbMock.on(PutItemCommand).resolves({ Attributes: { SettingName: { S: 'Test1' }, SettingValue: { N: 3 }, SettingCategory: { S: 'Custom' }, DefaultValue: { N: '4' }, nonce: { N: '0' } } })
        // GetParameters shows that there's one setting left out of the new settings JSON that was just saved
        dynamodbMock.on(ScanCommand).resolves({ Items: [{"SettingCategory":{"S":"Custom"}, "SettingValue": {"N":4},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"Test1"}}, {"SettingCategory":{"S":"Custom"}, "SettingValue": {"N":4},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"Test2"}}] })
        dynamodbMock.on(DeleteItemCommand, {TableName: mockedContext.rootState.info.SettingsTable, Key: {"SettingName": {"S": "Test2"}, "SettingCategory": {"S": "Custom"}}}).resolves({})

        const result = await settingsModule.updateSettings(mockedContext, { Test1: 3 });
        expect(result).toEqual({"changedSettings":["Test1",],"restoredSettings":["Test2",]});
    });

    test('listPrivateSettings', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: 'mockedValue',
                    DefaultQnABotSettings: 'mockedValue',
                    PrivateQnABotSettings: 'mockedValue',
                    SettingsTable: 'mockedTableName'
                },
            },
        };
        dynamodbMock.on(ScanCommand).resolves({ Items: [{"SettingCategory":{"S":"Custom"}, "SettingValue": {"N":4},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"Test1"}}, {"SettingCategory":{"S":"Custom"}, "SettingValue": {"N":4},"nonce":{"N":"0"},"DefaultValue":{"N":"4"},"SettingName":{"S":"Test2"}}] })
        const result = await settingsModule.listPrivateSettings(mockedContext);
        expect(result).toEqual({"Test1":4,"Test2":4});
    });

    test('listPrivateSettings - error thrown', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: 'mockedValue',
                    DefaultQnABotSettings: 'mockedValue',
                    PrivateQnABotSettings: 'mockedValue',
                },
            },
        };
        
        dynamodbMock.on(ScanCommand).rejects('mocked rejection');
        const result = await settingsModule.listPrivateSettings(mockedContext, {});
        expect(result).toEqual({});
    });

    test('getSettingsMap', async () => {
        const settingsMap = settingsModule.getSettingsMap();
        const groupKeys = Object.keys(settingsMap);
        groupKeys.forEach((groupKey) => {
            if (settingsMap[groupKey].label === undefined) {
                throw new Error(`${groupKey} is missing the 'label' attribute.`);
            }

            if (settingsMap[groupKey].openedPanels === undefined) {
                throw new Error(`${groupKey} is missing the 'openedPanels' attribute.`);
            }

            if (settingsMap[groupKey].subgroups === undefined) {
                throw new Error(`${groupKey} is missing the 'subgroups' attribute.`);
            }

            const memberIds = {};
            const subgroupKeys = Object.keys(settingsMap[groupKey].subgroups);
            subgroupKeys.forEach((subgroupKey) => {
                if (settingsMap[groupKey].subgroups[subgroupKey].label === undefined) {
                    throw new Error(`${subgroupKey} is missing the 'label' attribute.`);
                }

                if (settingsMap[groupKey].subgroups[subgroupKey].members === undefined) {
                    throw new Error(`${subgroupKey} is missing the 'members' attribute.`);
                }

                if (settingsMap[groupKey].subgroups[subgroupKey].id === undefined) {
                    throw new Error(`${subgroupKey} is missing the 'id' attribute.`);
                }

                if (settingsMap[groupKey].subgroups[subgroupKey].collapsed === undefined) {
                    throw new Error(`${subgroupKey} is missing the 'collapsed' attribute.`);
                }

                settingsMap[groupKey].subgroups[subgroupKey].members.forEach((member, index) => {
                    if (member.id === undefined || member.id === null || member.id === '') {
                        throw new Error(`${subgroupKey}.member ${index} is missing the 'id' attribute.`);
                    }
                    if (member.hint === undefined || member.hint === null || member.hint === '') {
                        throw new Error(`${subgroupKey}.member with 'id'=${member.id} is missing the 'hint' attribute.`);
                    }
                    if (member.type) {
                        if (!['string', 'number', 'boolean', 'enum', 'textarea'].find((memberType) => memberType === member.type)) {
                            throw new Error(`${subgroupKey}.member with 'id'='${member.id}' has an invalid 'type' attribute, '${member.type}'.`);
                        }
                    }
                    if (member.type === 'enum' && (!member.enums || member.enums.length === 0)) {
                        throw new Error(`${subgroupKey}.member with 'id'='${member.id}' has missing or empty 'enums' attribute.`);
                    }
                    if (memberIds[member.id]) {
                        throw new Error(`${subgroupKey}.member with 'id'='${member.id}' has a duplicate.`);
                    } else {
                        memberIds[member.id] = true;
                    }
                });
            });
        });
    });
});
