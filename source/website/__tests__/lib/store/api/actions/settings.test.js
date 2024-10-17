/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import settingsModule from '../../../../../js/lib/store/api/actions/settings';

const awsMock = require('aws-sdk-client-mock');
const { SSMClient, GetParametersCommand, GetParameterCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');
const ssmMock = awsMock.mockClient(SSMClient);

describe('settings action', () => {
    beforeEach(() => {
        ssmMock.reset();
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
                },
            },
        };
        ssmMock.on(GetParametersCommand).resolves({Parameters: [
            { Value: '{}' },
            { Value: '{}' },
        ]});
        const result = await settingsModule.listSettings(mockedContext);
        expect(result).toEqual([{}, {}, {}]);
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
                },
            },
        };
        ssmMock.on(GetParametersCommand).rejects('mocked rejection');
        await expect(settingsModule.listSettings(mockedContext)).rejects.toThrow('Error back from request: Error: mocked rejection');
    });

    test('updateSettings', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: {},
                    DefaultQnABotSettings: {},
                },
            },
        };
        ssmMock.on(PutParameterCommand).resolves({ Tier: 'Standard', Version: 1 });
        const result = await settingsModule.updateSettings(mockedContext, { key: 'value' });
        expect(result).toEqual({ Tier: 'Standard', Version: 1 });
    });

    test('updateSettings -- error thrown', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: {},
                    DefaultQnABotSettings: {},
                },
            },
        };
        ssmMock.on(PutParameterCommand).rejects('mocked rejection');
        await expect(settingsModule.updateSettings(mockedContext, {})).rejects.toThrow('Error back from request: Error: mocked rejection');
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
                },
            },
        };
        ssmMock.on(GetParameterCommand).resolves({Parameter: { Value: "{\"ALT_SEARCH_KENDRA_INDEXES\":\"mockIndex\",\"KENDRA_FAQ_INDEX\":\"mockIndex\",\"KENDRA_WEB_PAGE_INDEX\":\"mockIndex\"}" } });
        const result = await settingsModule.listPrivateSettings(mockedContext);
        expect(result).toEqual({"ALT_SEARCH_KENDRA_INDEXES": "mockIndex", "KENDRA_FAQ_INDEX": "mockIndex", "KENDRA_WEB_PAGE_INDEX": "mockIndex"});
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
        
        ssmMock.on(GetParameterCommand).rejects('mocked rejection');
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
