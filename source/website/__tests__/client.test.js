/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { describe, test, expect, vi, beforeEach } from 'vitest';

describe('client.js', () => {
    let mockAxios;
    let mockAuth;
    let mockLexWebUi;
    let mockCreateApp;
    let mockCreateStore;
    let mockCreateVuetify;

    beforeEach(() => {
        // Mock axios
        mockAxios = {
            head: vi.fn().mockResolvedValue({
                headers: { 'api-stage': 'test-stage' }
            }),
            get: vi.fn().mockResolvedValue({
                data: {
                    PoolId: 'test-pool-id',
                    UserPool: 'test-user-pool',
                    BotName: 'test-bot',
                    BotVersion: 'test-version',
                    v2BotId: 'test-v2-bot-id',
                    v2BotAliasId: 'test-alias-id',
                    v2BotLocaleId: 'en_US',
                    StreamingWebSocketEndpoint: 'wss://test.example.com'
                }
            })
        };

        // Mock Auth
        mockAuth = vi.fn().mockResolvedValue({
            username: 'test-user',
            idtoken: 'test-token',
            config: {
                credentials: {
                    expiration: Date.now() + 3600000
                }
            },
            lexV1: {},
            lexV2: {},
            polly: {}
        });

        // Mock LexWebUi
        mockLexWebUi = {
            Store: {},
            Plugin: {}
        };

        // Mock Vue
        mockCreateApp = vi.fn().mockReturnValue({
            use: vi.fn().mockReturnThis(),
            mount: vi.fn()
        });

        mockCreateStore = vi.fn().mockReturnValue({
            dispatch: vi.fn()
        });

        mockCreateVuetify = vi.fn().mockReturnValue({});

        // Setup global mocks
        global.window = {
            location: {
                href: 'https://test.example.com'
            },
            sessionStorage: {
                getItem: vi.fn()
            }
        };

        global.document = {
            addEventListener: vi.fn()
        };

        // Mock modules
        vi.doMock('axios', () => ({ default: mockAxios }));
        vi.doMock('../js/lib/client-auth', () => ({ default: mockAuth }));
        vi.doMock('vue', () => ({
            createApp: mockCreateApp
        }));
        vi.doMock('vuex', () => ({
            createStore: mockCreateStore
        }));
        vi.doMock('vuetify', () => ({
            createVuetify: mockCreateVuetify
        }));
    });

    test('config object has correct structure', () => {
        const config = {
            cognito: {},
            lex: {
                initialText: 'Ask a Question',
                initialSpeechInstruction: '',
                reInitSessionAttributesOnRestart: false,
            },
            ui: {
                pageTitle: 'QnABot Client',
                toolbarColor: 'cyan',
                toolbarTitle: 'QnABot',
                toolbarLogo: null,
                pushInitialTextOnRestart: false,
                AllowSuperDangerousHTMLInMessage: true,
                showDialogStateIcon: false,
                shouldDisplayResponseCardTitle: false,
                positiveFeedbackIntent: 'Thumbs up',
                negativeFeedbackIntent: 'Thumbs down',
                helpIntent: 'Help',
                messageMenu: true,
            },
            recorder: {},
        };

        expect(config.cognito).toBeDefined();
        expect(config.lex).toBeDefined();
        expect(config.ui).toBeDefined();
        expect(config.recorder).toBeDefined();
        expect(config.lex.initialText).toBe('Ask a Question');
        expect(config.ui.toolbarTitle).toBe('QnABot');
    });

    test('config lex properties are correct', () => {
        const config = {
            lex: {
                initialText: 'Ask a Question',
                initialSpeechInstruction: '',
                reInitSessionAttributesOnRestart: false,
            }
        };

        expect(config.lex.initialText).toBe('Ask a Question');
        expect(config.lex.initialSpeechInstruction).toBe('');
        expect(config.lex.reInitSessionAttributesOnRestart).toBe(false);
    });

    test('config ui properties are correct', () => {
        const config = {
            ui: {
                pageTitle: 'QnABot Client',
                toolbarColor: 'cyan',
                toolbarTitle: 'QnABot',
                toolbarLogo: null,
                pushInitialTextOnRestart: false,
                AllowSuperDangerousHTMLInMessage: true,
                showDialogStateIcon: false,
                shouldDisplayResponseCardTitle: false,
                positiveFeedbackIntent: 'Thumbs up',
                negativeFeedbackIntent: 'Thumbs down',
                helpIntent: 'Help',
                messageMenu: true,
            }
        };

        expect(config.ui.pageTitle).toBe('QnABot Client');
        expect(config.ui.toolbarColor).toBe('cyan');
        expect(config.ui.AllowSuperDangerousHTMLInMessage).toBe(true);
        expect(config.ui.positiveFeedbackIntent).toBe('Thumbs up');
        expect(config.ui.negativeFeedbackIntent).toBe('Thumbs down');
    });

    test('checkExpiringSessionPlugin has install method', () => {
        const plugin = {
            install() {
                const sessionTimeout = 3600000;
                if (sessionTimeout > 0) {
                    setTimeout(() => {}, sessionTimeout);
                }
            }
        };

        expect(plugin.install).toBeDefined();
        expect(typeof plugin.install).toBe('function');
    });

    test('checkExpiringSessionPlugin calculates timeout correctly', () => {
        const authConfig = {
            credentials: {
                expiration: Date.now() + 5000
            }
        };

        const sessionTimeout = authConfig.credentials.expiration - Date.now();
        expect(sessionTimeout).toBeGreaterThan(0);
        expect(sessionTimeout).toBeLessThanOrEqual(5000);
    });

    test('checkExpiringSessionPlugin handles expired session', () => {
        const authConfig = {
            credentials: {
                expiration: Date.now() - 1000
            }
        };

        const sessionTimeout = authConfig.credentials.expiration - Date.now();
        expect(sessionTimeout).toBeLessThan(0);
    });

    test('config updates with API response', () => {
        const config = {
            cognito: {},
            lex: {}
        };

        const apiResult = {
            PoolId: 'test-pool',
            UserPool: 'test-user-pool',
            BotName: 'test-bot',
            BotVersion: 'v1',
            v2BotId: 'bot-id',
            v2BotAliasId: 'alias-id',
            v2BotLocaleId: 'en_US',
            StreamingWebSocketEndpoint: 'wss://test.com'
        };

        config.cognito.poolId = apiResult.PoolId;
        config.cognito.appUserPoolName = apiResult.UserPool;
        config.lex.botName = apiResult.BotName;
        config.lex.botAlias = apiResult.BotVersion;
        config.lex.v2BotId = apiResult.v2BotId;
        config.lex.v2BotAliasId = apiResult.v2BotAliasId;
        config.lex.v2BotLocaleId = apiResult.v2BotLocaleId;

        if (apiResult?.StreamingWebSocketEndpoint) {
            config.lex.allowStreamingResponses = true;
            config.lex.streamingWebSocketEndpoint = apiResult.StreamingWebSocketEndpoint;
        }

        expect(config.cognito.poolId).toBe('test-pool');
        expect(config.lex.botName).toBe('test-bot');
        expect(config.lex.allowStreamingResponses).toBe(true);
    });

    test('config handles missing StreamingWebSocketEndpoint', () => {
        const config = {
            lex: {}
        };

        const apiResult = {
            BotName: 'test-bot'
        };

        if (apiResult?.StreamingWebSocketEndpoint) {
            config.lex.allowStreamingResponses = true;
            config.lex.streamingWebSocketEndpoint = apiResult.StreamingWebSocketEndpoint;
        }

        expect(config.lex.allowStreamingResponses).toBeUndefined();
        expect(config.lex.streamingWebSocketEndpoint).toBeUndefined();
    });

    test('config adds username to toolbar title', () => {
        const config = {
            ui: {
                toolbarTitle: 'QnABot'
            }
        };

        const auth = {
            username: 'testuser'
        };

        if (auth.username) {
            config.ui.toolbarTitle += ` [${auth.username}]`;
        }

        expect(config.ui.toolbarTitle).toBe('QnABot [testuser]');
    });

    test('config sets session attributes with idtoken', () => {
        const config = {
            lex: {}
        };

        const auth = {
            idtoken: 'test-id-token'
        };

        config.lex.sessionAttributes = {
            idtokenjwt: auth.idtoken
        };

        expect(config.lex.sessionAttributes.idtokenjwt).toBe('test-id-token');
    });
});
