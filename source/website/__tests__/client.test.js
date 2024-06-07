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
require('../js/client');

jest.mock('vuetify/iconsets/md', () => ({
    aliases: {},
    md: {},
}));

jest.mock('vuetify/components', () => {});

jest.mock('vuetify/directives', () => {});

jest.mock('vuetify', () => ({
    createVuetify: jest.fn(),
}));

jest.mock('axios', () => ({
    head: jest.fn().mockReturnValue({
        headers: { 'api-stage': 'dev' },
    }),
    get: jest.fn().mockReturnValue({
        data: {
            PoolId: 'test-pool-id',
            BotName: 'test-bot-name',
            BotVersion: 'test-bot-version',
            v2BotId: 'test-bot-id',
            v2BotAliasId: 'test-bot-alias-id',
            v2BotLocaleId: 'test-bot-locale-id',
        },
    }),
}));

jest.mock('../js/lib/client-auth', () => (() => ({
    username: 'test-username',
    idtoken: 'test-idtoken',
    config: {
        credentials: {
            expiration: (Date.now() + 5000),
        },
    },
    lex: {},
    polly: {},
})));

jest.mock('aws-lex-web-ui/dist/lex-web-ui.min.js', () => ({
    Store: {
        dispatch: jest.fn(),
    },
}));

describe('js client module', () => {
    test('DOMContentLoaded', async () => {
        await document.dispatchEvent(new Event('DOMContentLoaded', {
            bubbles: false,
            cancelable: true,
        }));
    });
});
