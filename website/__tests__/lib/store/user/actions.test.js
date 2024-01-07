/**
 * @jest-environment jsdom
 */
/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');
const actionsModule = require('../../../../js/lib/store/user/actions');
const axios = require('axios');
const query = require('query-string');
const jwt = require('jsonwebtoken');

jest.mock('@aws-sdk/credential-providers');
jest.mock('axios');
jest.mock('jsonwebtoken');

describe('user actions test', () => {
    let windowSpy;

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
        windowSpy = jest.spyOn(window, 'window', 'get');
        windowSpy.mockReturnValue({
            alert: jest.fn(),
            confirm: jest.fn(),
            sessionStorage: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                clear: jest.fn(),
            },
            window: {
                location: {
                    href: '',
                },
            },
            location: {
                search: '?code=200',
                origin: 'test.origin',
                pathname: '/test/path',
            },
        });
    });

    afterEach(() => {
        windowSpy.mockRestore();
        jest.resetAllMocks();
    });

    test('refresh tokens', async () => {
        const mockedContext = {
            rootState: {
                info: {
                    _links: {
                        CognitoEndpoint: {
                            href: 'some.endpoint',
                        },
                    },
                    ClientIdDesigner: 'XXXXXXXXX',
                },
            },
            state: {
                token: '',
            },
        };
        const testIdToken = 'test-id-token';
        const testAccessToken = 'test-access-token';
        const testRefreshToken = 'test-refresh-token';
        const mockedTokens = {
            data: {
                id_token: testIdToken,
                access_token: testAccessToken,
                refresh_token: testRefreshToken,
            },
        };

        window.sessionStorage.getItem.mockReturnValueOnce(testRefreshToken);
        axios.mockReturnValueOnce(mockedTokens);

        await actionsModule.refreshTokens(mockedContext);
        expect(axios).toHaveBeenCalledTimes(1);
        expect(axios).toHaveBeenCalledWith({
            method: 'POST',
            url: `${mockedContext.rootState.info._links.CognitoEndpoint.href}/oauth2/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: query.stringify({
                grant_type: 'refresh_token',
                client_id: mockedContext.rootState.info.ClientIdDesigner,
                refresh_token: testRefreshToken,
            }),
        });
        expect(window.sessionStorage.setItem).toHaveBeenCalledTimes(3);
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith('id_token', testIdToken);
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith('access_token', testAccessToken);
        expect(window.sessionStorage.setItem).toHaveBeenCalledWith('refresh_token', testRefreshToken);
        expect(mockedContext.state.token).toEqual(testIdToken);
    });

    test('refresh tokens -- expired credentials 1', async () => {
        const mockedContext = {
            dispatch: jest.fn(),
            rootState: {
                info: {
                    _links: {
                        CognitoEndpoint: {
                            href: 'some.endpoint',
                        },
                        DesignerLogin: {
                            href: 'some.login.endpoint',
                        },
                    },
                    ClientIdDesigner: 'XXXXXXXXX',
                },
            },
            state: {
                token: '',
            },
        };
        const testRefreshToken = 'test-refresh-token';
        const testError = new Error('test-error');

        window.sessionStorage.getItem.mockReturnValueOnce(testRefreshToken);
        window.confirm.mockReturnValue(true);
        axios.mockReturnValueOnce(testError);

        await actionsModule.refreshTokens(mockedContext);
        expect(axios).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('logout');
        expect(window.window.location.href)
            .toEqual(mockedContext.rootState.info._links.DesignerLogin.href);
    });

    test('refresh tokens -- expired credentials 2', async () => {
        const mockedContext = {
            dispatch: jest.fn(),
            rootState: {
                info: {
                    _links: {
                        CognitoEndpoint: {
                            href: 'some.endpoint',
                        },
                        DesignerLogin: {
                            href: 'some.login.endpoint',
                        },
                    },
                    ClientIdDesigner: 'XXXXXXXXX',
                },
            },
            state: {
                token: '',
            },
        };
        const testRefreshToken = 'test-refresh-token';
        const testError = new Error('test-error');

        window.sessionStorage.getItem.mockReturnValueOnce(testRefreshToken);
        window.confirm.mockReturnValue(false);
        axios.mockReturnValueOnce(testError);

        await actionsModule.refreshTokens(mockedContext);
        expect(axios).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(0);
    });

    test('get credentials -- no credentials', async () => {
        const mockedContext = {
            rootState: {
                info: {
                    region: 'us-weast-1',
                    PoolId: 'XXXXXXXXX',
                },
            },
            state: {
                token: '',
            },
        };
        const logins = {};
        logins[[
            'cognito-idp.',
            mockedContext.rootState.info.region,
            '.amazonaws.com/',
            mockedContext.rootState.info.UserPool,
        ].join('')] = mockedContext.state.token;
        fromCognitoIdentityPool.mockReturnValueOnce(jest.fn().mockReturnValueOnce({}));
        await expect(actionsModule.getCredentials(mockedContext)).resolves.toEqual({});
        expect(fromCognitoIdentityPool).toHaveBeenCalledTimes(1);
        expect(fromCognitoIdentityPool).toHaveBeenCalledWith({
            identityPoolId: mockedContext.rootState.info.PoolId,
            logins,
            clientConfig: { region: mockedContext.rootState.info.region },
        });
    });

    test('get credentials -- renew credentials', async () => {
        const mockedContext = {
            rootState: {
                info: {
                    region: 'us-weast-1',
                    PoolId: 'XXXXXXXXX',
                },
            },
            state: {
                token: 'test-token',
                credentials: {
                    expiration: new Date(Date.now() - 1000),
                },
            },
        };
        const mockedNewCredentials = {
            expiration: new Date(Date.now() + 1000),
        };
        const logins = {};
        logins[[
            'cognito-idp.',
            mockedContext.rootState.info.region,
            '.amazonaws.com/',
            mockedContext.rootState.info.UserPool,
        ].join('')] = mockedContext.state.token;
        fromCognitoIdentityPool.mockReturnValueOnce(jest.fn().mockReturnValueOnce(mockedNewCredentials));
        await expect(actionsModule.getCredentials(mockedContext))
            .resolves.toEqual(mockedNewCredentials);
        expect(fromCognitoIdentityPool).toHaveBeenCalledTimes(1);
        expect(fromCognitoIdentityPool).toHaveBeenCalledWith({
            identityPoolId: mockedContext.rootState.info.PoolId,
            logins,
            clientConfig: { region: mockedContext.rootState.info.region },
        });
    });

    test('get credentials -- non-expiring credentials', async () => {
        const mockedContext = {
            rootState: {
                info: {
                    region: 'us-weast-1',
                    PoolId: 'XXXXXXXXX',
                },
            },
            state: {
                token: 'test-token',
                credentials: {
                    expiration: '',
                },
            },
        };
        const expectedCredentials = {
            expiration: '',
        };
        const logins = {};
        logins[[
            'cognito-idp.',
            mockedContext.rootState.info.region,
            '.amazonaws.com/',
            mockedContext.rootState.info.UserPool,
        ].join('')] = mockedContext.state.token;
        fromCognitoIdentityPool.mockReturnValueOnce(jest.fn().mockReturnValueOnce(expectedCredentials));
        await expect(actionsModule.getCredentials(mockedContext))
            .resolves.toEqual(expectedCredentials);
        expect(fromCognitoIdentityPool).toHaveBeenCalledTimes(0);
    });

    test('get credentials -- throws expired token error', async () => {
        const mockedContext = {
            dispatch: jest.fn(),
            rootState: {
                info: {
                    region: 'us-weast-1',
                    PoolId: 'XXXXXXXXX',
                },
            },
            state: {
                token: 'test-token',
                credentials: {
                    expiration: new Date(Date.now() - 1000),
                },
            },
        };
        const mockedNewCredentials = {
            expiration: new Date(Date.now() + 1000),
        };
        const logins = {};
        logins[[
            'cognito-idp.',
            mockedContext.rootState.info.region,
            '.amazonaws.com/',
            mockedContext.rootState.info.UserPool,
        ].join('')] = mockedContext.state.token;
        fromCognitoIdentityPool
            .mockReturnValueOnce(jest.fn().mockImplementation(() => {
                throw new Error('Token expired');
            }))
            .mockReturnValueOnce(jest.fn().mockReturnValueOnce(mockedNewCredentials));
        await expect(actionsModule.getCredentials(mockedContext))
            .resolves.toEqual(mockedNewCredentials);
        expect(fromCognitoIdentityPool).toHaveBeenCalledTimes(2);
        expect(fromCognitoIdentityPool).toHaveBeenCalledWith({
            identityPoolId: mockedContext.rootState.info.PoolId,
            logins,
            clientConfig: { region: mockedContext.rootState.info.region },
        });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('refreshTokens');
    });

    test('get credentials -- throws inactive token error', async () => {
        const mockedContext = {
            dispatch: jest.fn(),
            rootState: {
                info: {
                    region: 'us-weast-1',
                    PoolId: 'XXXXXXXXX',
                },
            },
            state: {
                token: 'test-token',
                credentials: {
                    expiration: new Date(Date.now() - 1000),
                },
            },
        };
        const mockedNewCredentials = {
            expiration: new Date(Date.now() + 1000),
        };
        const logins = {};
        logins[[
            'cognito-idp.',
            mockedContext.rootState.info.region,
            '.amazonaws.com/',
            mockedContext.rootState.info.UserPool,
        ].join('')] = mockedContext.state.token;
        fromCognitoIdentityPool
            .mockReturnValueOnce(jest.fn().mockImplementation(() => {
                throw new Error('inactive');
            }))
            .mockReturnValueOnce(jest.fn().mockReturnValueOnce(mockedNewCredentials));
        await expect(actionsModule.getCredentials(mockedContext))
            .resolves.toEqual(mockedNewCredentials);
        expect(fromCognitoIdentityPool).toHaveBeenCalledTimes(2);
        expect(fromCognitoIdentityPool).toHaveBeenCalledWith({
            identityPoolId: mockedContext.rootState.info.PoolId,
            logins,
            clientConfig: { region: mockedContext.rootState.info.region },
        });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('refreshTokens');
    });

    test('get credentials -- throws unknown error', async () => {
        const mockedContext = {
            dispatch: jest.fn(),
            rootState: {
                info: {
                    region: 'us-weast-1',
                    PoolId: 'XXXXXXXXX',
                },
            },
            state: {
                token: 'test-token',
                credentials: {
                    expiration: new Date(Date.now() - 1000),
                },
            },
        };
        const mockedNewCredentials = {
            expiration: new Date(Date.now() + 1000),
        };
        const unexpectedError = new Error('Some other error');
        const logins = {};
        logins[[
            'cognito-idp.',
            mockedContext.rootState.info.region,
            '.amazonaws.com/',
            mockedContext.rootState.info.UserPool,
        ].join('')] = mockedContext.state.token;
        fromCognitoIdentityPool
            .mockReturnValueOnce(jest.fn().mockImplementation(() => {
                throw unexpectedError;
            }))
        await expect(actionsModule.getCredentials(mockedContext))
            .rejects.toEqual(unexpectedError);
        expect(fromCognitoIdentityPool).toHaveBeenCalledTimes(1);
        expect(fromCognitoIdentityPool).toHaveBeenCalledWith({
            identityPoolId: mockedContext.rootState.info.PoolId,
            logins,
            clientConfig: { region: mockedContext.rootState.info.region },
        });
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(0);
    });

    test('logout', () => {
        actionsModule.logout();
        expect(window.sessionStorage.clear).toHaveBeenCalledTimes(1);
    });

    test('login -- id_token exists', async () => {
        const mockedContext = {
            state: {
                token: '',
                name: '',
                groups: '',
            },
            rootState: {
                info: {
                    _links: {
                        CognitoEndpoint: {
                            href: 'some.cognito.endpoint',
                        },
                        DesignerLogin: {
                            href: 'some.login.endpoint',
                        },
                    },
                    ClientIdDesigner: 'XXXXXXXXX',
                },
            },
        };
        const testIdToken = 'test-id-token';
        const testAccessToken = 'test-access-token';
        const testRefreshToken = 'test-refresh-token';
        const mockedTokens = {
            data: {
                id_token: testIdToken,
                access_token: testAccessToken,
                refresh_token: testRefreshToken,
            },
        };
        const testToken = {
            'cognito:username': 'testusername',
            'cognito:groups': 'Admins',
        };

        window.sessionStorage.getItem.mockReturnValueOnce(testIdToken);
        axios.mockReturnValueOnce(mockedTokens);
        jwt.decode.mockReturnValue(testToken);
        await actionsModule.login(mockedContext);
        expect(jwt.decode).toHaveBeenCalledTimes(1);
        expect(jwt.decode).toHaveBeenCalledWith(testIdToken);
        expect(mockedContext.state.name).toEqual(testToken['cognito:username']);
        expect(mockedContext.state.groups).toEqual(testToken['cognito:groups']);

        // The assertion below becomes false when the getTokens function is called.
        expect(axios).toHaveBeenCalledTimes(0);

        // The alert window should not be called since the user belongs to Admins group.
        expect(window.alert).toHaveBeenCalledTimes(0);
    });

    test('login -- id_token does not exist', async () => {
        const mockedContext = {
            state: {
                token: '',
                name: '',
                groups: '',
            },
            rootState: {
                info: {
                    _links: {
                        CognitoEndpoint: {
                            href: 'some.cognito.endpoint',
                        },
                        DesignerLogin: {
                            href: 'some.login.endpoint',
                        },
                    },
                    ClientIdDesigner: 'XXXXXXXXX',
                },
            },
        };
        const testIdToken = 'test-id-token';
        const testAccessToken = 'test-access-token';
        const testRefreshToken = 'test-refresh-token';
        const mockedTokens = {
            data: {
                id_token: testIdToken,
                access_token: testAccessToken,
                refresh_token: testRefreshToken,
            },
        };
        const testToken = {
            'cognito:username': 'testusername',
            'cognito:groups': 'testgroup',
        };

        axios.mockReturnValueOnce(mockedTokens);
        jwt.decode.mockReturnValue(testToken);
        await actionsModule.login(mockedContext);
        expect(jwt.decode).toHaveBeenCalledTimes(1);
        expect(jwt.decode).toHaveBeenCalledWith(testIdToken);
        expect(mockedContext.state.name).toEqual(testToken['cognito:username']);
        expect(mockedContext.state.groups).toEqual(testToken['cognito:groups']);
        expect(window.alert).toHaveBeenCalledTimes(1);
        expect(window.window.location.href)
            .toEqual(mockedContext.rootState.info._links.DesignerLogin.href);

        // The assertions below become true when the getTokens function is called.
        expect(axios).toHaveBeenCalledTimes(1);
        expect(axios).toHaveBeenCalledWith({
            method: 'POST',
            url: `${mockedContext.rootState.info._links.CognitoEndpoint.href}/oauth2/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: query.stringify({
                grant_type: 'authorization_code',
                client_id: mockedContext.rootState.info.ClientIdDesigner,
                code: 200,
                redirect_uri: window.location.origin + window.location.pathname,
            }),
        });
        expect(mockedContext.state.token).toEqual(testIdToken);
    });

    test('login -- unable to fetch credentials 1', async () => {
        const mockedContext = {
            dispatch: jest.fn(),
            state: {
                token: '',
                name: '',
                groups: '',
            },
            rootState: {
                info: {
                    _links: {
                        CognitoEndpoint: {
                            href: 'some.cognito.endpoint',
                        },
                        DesignerLogin: {
                            href: 'some.login.endpoint',
                        },
                    },
                    ClientIdDesigner: 'XXXXXXXXX',
                },
            },
        };
        const testToken = {
            'cognito:username': 'testusername',
            'cognito:groups': 'testgroup',
        };
        const testError = new Error('test error');

        axios.mockReturnValueOnce(testError);
        jwt.decode.mockReturnValue(testToken);
        window.confirm.mockReturnValueOnce(true);
        await actionsModule.login(mockedContext);

        // The assertions below become true when the getTokens function is called.
        expect(axios).toHaveBeenCalledTimes(1);
        expect(axios).toHaveBeenCalledWith({
            method: 'POST',
            url: `${mockedContext.rootState.info._links.CognitoEndpoint.href}/oauth2/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: query.stringify({
                grant_type: 'authorization_code',
                client_id: mockedContext.rootState.info.ClientIdDesigner,
                code: 200,
                redirect_uri: window.location.origin + window.location.pathname,
            }),
        });
        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(window.confirm).toHaveBeenCalledWith('Unable to fetch credentials, please log back in. Click Ok to be redirected to the login page.');
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('logout');
    });

    test('login -- unable to fetch credentials 2', async () => {
        const mockedContext = {
            dispatch: jest.fn(),
            state: {
                token: '',
                name: '',
                groups: '',
            },
            rootState: {
                info: {
                    _links: {
                        CognitoEndpoint: {
                            href: 'some.cognito.endpoint',
                        },
                        DesignerLogin: {
                            href: 'some.login.endpoint',
                        },
                    },
                    ClientIdDesigner: 'XXXXXXXXX',
                },
            },
        };
        const testToken = {
            'cognito:username': 'testusername',
            'cognito:groups': 'testgroup',
        };
        const testError = new Error('test error');

        axios.mockReturnValueOnce(testError);
        jwt.decode.mockReturnValue(testToken);
        window.confirm.mockReturnValueOnce(false);
        await actionsModule.login(mockedContext);

        // The assertions below become true when the getTokens function is called.
        expect(axios).toHaveBeenCalledTimes(1);
        expect(axios).toHaveBeenCalledWith({
            method: 'POST',
            url: `${mockedContext.rootState.info._links.CognitoEndpoint.href}/oauth2/token`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: query.stringify({
                grant_type: 'authorization_code',
                client_id: mockedContext.rootState.info.ClientIdDesigner,
                code: 200,
                redirect_uri: window.location.origin + window.location.pathname,
            }),
        });
        expect(window.confirm).toHaveBeenCalledTimes(1);
        expect(window.confirm).toHaveBeenCalledWith('Unable to fetch credentials, please log back in. Click Ok to be redirected to the login page.');
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(0);
    });
});
