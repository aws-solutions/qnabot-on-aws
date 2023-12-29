/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
import settingsModule from '../../../../../js/lib/store/api/actions/settings';

jest.mock('@aws-sdk/client-ssm', () => ({
    SSM: jest.fn().mockImplementation(() => ({
        putParameter: jest.fn().mockImplementation((params, fn) => {
            if (typeof(fn) === 'function') {
                fn(params.Value === '{}', { mockedKey: 'mockedValue' });
            }
        }),
        getParameters: jest.fn().mockImplementation((params, fn) => {
            if (typeof(fn) === 'function') {
                fn(Object.keys(params.Names[0]).length === 0, {
                    Parameters: [
                        { Value: '{}' },
                        { Value: '{}' },
                    ],
                });
            }
        }),
    })),
}));

describe('settings action', () => {
    test('listSettings', async () => {
        const mockedContext = {
            rootState: {
                user: {
                    credentials: '',
                },
                info: {
                    CustomQnABotSettings: { mockedKey: 'mockedValue' },
                    DefaultQnABotSettings: { mockedKey: 'mockedValue' },
                },
            },
        };
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
        let err;
        await settingsModule.listSettings(mockedContext).catch((error) => { err = error; });
        expect(err).not.toBeUndefined();
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
        const result = await settingsModule.updateSettings(mockedContext, { key: 'value' });
        expect(result).toEqual({ mockedKey: 'mockedValue' });
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
        let err;
        await settingsModule.updateSettings(mockedContext, {}).catch((error) => { err = error; });
        expect(err).not.toBeUndefined();
    });
});
