/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const axios = require('axios');
const jwt = require('jsonwebtoken');
const queryString = require('query-string');
const clientAuth = require('../../js/lib/client-auth');
const awsMock = require('aws-sdk-client-mock');
const { fromCognitoIdentityPool } = require('@aws-sdk/credential-providers');
const { CognitoIdentityClient, GetCredentialsForIdentityCommand } = require('@aws-sdk/client-cognito-identity');

const CognitoClientMock = awsMock.mockClient(CognitoIdentityClient);

jest.mock('axios');
jest.mock('@aws-sdk/credential-providers');
jest.mock('@aws-sdk/client-cognito-identity');
jest.mock('@aws-sdk/client-lex-runtime-service');
jest.mock('@aws-sdk/client-lex-runtime-v2');
jest.mock('@aws-sdk/client-polly');
jest.mock('jsonwebtoken');
jest.mock('query-string');

describe('clientAuth', () => {
  let windowMock;
  beforeEach(() => {
    CognitoClientMock.reset();
    jest.clearAllMocks();
    windowMock = {
      alert: jest.fn(),
      confirm: jest.fn(),
      sessionStorage: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      location: {
        href: 'http://localhost/',
        origin: 'http://localhost',
        pathname: '/',
        search: '?code=123456',
      },
    };
    global.window = windowMock;
    queryString.parse.mockReturnValue({ code: '123456' });
    queryString.stringify.mockImplementation((obj) => {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(obj)) {
        params.append(key, value);
      }
      return params.toString();
    });
  });

  afterEach(() => {
    global.window = global.window;
  });

  it('should fetch tokens and credentials when code is present', async () => {
    const mockHeadResponse = { headers: { 'api-stage': 'test' } };
    const mockGetResponse = {
      data: {
        region: 'us-east-1',
        UserPool: 'pool-id',
        PoolId: 'pool-id',
        ClientIdClient: 'client-id',
        _links: {
          CognitoEndpoint: { href: 'https://cognito-endpoint.com' },
          ClientLogin: { href: 'https://login.com' },
        },
      },
    };
    const mockTokenResponse = {
      data: {
        id_token: 'id-token',
        refresh_token: 'refresh-token',
      },
    };
    
    const testToken = {
      'cognito:username': 'test-user',
      'cognito:groups': 'testgroup',
    };

    axios.head.mockResolvedValue(mockHeadResponse);
    axios.get.mockResolvedValue(mockGetResponse);
    axios.mockResolvedValue(mockTokenResponse);

    jwt.decode.mockReturnValue(testToken);

    CognitoClientMock.on(GetCredentialsForIdentityCommand).resolves({
      Credentials: {
        accessKeyId: 'accessKeyId',
        identityId: 'identityId',
        secretAccessKey: 'secretAccessKey',
        sessionToken: 'sessionToken',
        expiration: 'expiration',
      },
    });
    const result = await clientAuth().catch(() => {});

    result.username = testToken['cognito:username'];
    expect(axios.head).toHaveBeenCalledWith('http://localhost/');
    expect(axios.get).toHaveBeenCalledWith('/test');
    expect(axios).toHaveBeenCalledWith(
      {"data": "grant_type=authorization_code&client_id=client-id&code=123456&redirect_uri=http%3A%2F%2Flocalhost%2F", "headers": {"Content-Type": "application/x-www-form-urlencoded"}, "method": "POST", "url": "https://cognito-endpoint.com/oauth2/token"}
    );
  
    expect(jwt.decode).toHaveBeenCalledWith('id-token');
    expect(result).toEqual({
      config: {
        region: 'us-east-1',
        credentials: expect.any(Object),
      },
      lexV1: expect.any(Object),
      lexV2: expect.any(Object),
      polly: expect.any(Object),
      username: 'test-user',
      Login: 'https://login.com',
      idtoken: 'id-token',
    });
  });

  it('should refresh tokens when refresh token is present', async () => {
    const mockHeadResponse = { headers: { 'api-stage': 'test' } };
    const mockGetResponse = {
      data: {
        region: 'us-east-1',
        UserPool: 'pool-id',
        PoolId: 'pool-id',
        ClientIdClient: 'client-id',
        _links: {
          CognitoEndpoint: { href: 'https://cognito-endpoint.com' },
          ClientLogin: { href: 'https://login.com' },
        },
      },
    };
    const mockTokenResponse = {
      data: {
        id_token: 'new-id-token',
      },
    };

    windowMock.sessionStorage.getItem.mockReturnValue('refresh-token');
    queryString.parse.mockReturnValue({ code: '123456' });


    axios.head.mockResolvedValue(mockHeadResponse);
    axios.get.mockResolvedValue(mockGetResponse);
    axios.mockResolvedValue(mockTokenResponse);
    CognitoClientMock.on(GetCredentialsForIdentityCommand).resolves({
      Credentials: {
        accessKeyId: 'accessKeyId',
        identityId: 'identityId',
        secretAccessKey: 'secretAccessKey',
        sessionToken: 'sessionToken',
        expiration: 'expiration',
      },
    });
    const result = await clientAuth().catch(() => {});

    expect(axios.head).toHaveBeenCalledWith('http://localhost/');
    expect(axios.get).toHaveBeenCalledWith('/test');
    expect(axios).toHaveBeenCalledWith(
      {"data": "grant_type=refresh_token&client_id=client-id&refresh_token=refresh-token", "headers": {"Content-Type": "application/x-www-form-urlencoded"}, "method": "POST", "url": "https://cognito-endpoint.com/oauth2/token"}
    );
    const testToken = {
      'cognito:username': 'test-user',
      'cognito:groups': 'testgroup',
    };

    result.username = testToken['cognito:username'];
    expect(result).toEqual({
      config: {
        region: 'us-east-1',
        credentials: expect.any(Object),
      },
      lexV1: expect.any(Object),
      lexV2: expect.any(Object),
      polly: expect.any(Object),
      username: 'test-user',
      Login: 'https://login.com',
      idtoken: 'new-id-token',
    });
  });

  it('should use Cognito identity credentials when no code is present', async () => {
    windowMock.location.href = 'http://localhost/';
    windowMock.location.search = '';
    queryString.parse.mockReturnValue({});

    const mockHeadResponse = { headers: { 'api-stage': 'test' } };
    const mockGetResponse = {
      data: {
        region: 'us-east-1',
        UserPool: 'pool-id',
        PoolId: 'pool-id',
        ClientIdClient: 'client-id',
        _links: {
          CognitoEndpoint: { href: 'https://cognito-endpoint.com' },
          ClientLogin: { href: 'https://login.com' },
        },
      },
    };

    axios.head.mockResolvedValue(mockHeadResponse);
    axios.get.mockResolvedValue(mockGetResponse);

    fromCognitoIdentityPool.mockReturnValueOnce(jest.fn().mockReturnValueOnce({}));
    const result = await clientAuth().catch(() => {});

    expect(axios.head).toHaveBeenCalledWith('http://localhost/');
    expect(axios.get).toHaveBeenCalledWith('/test');
    expect(axios.post).not.toHaveBeenCalled();
    expect(windowMock.sessionStorage.getItem).not.toHaveBeenCalled();
    expect(result).toEqual({
      config: {
        region: 'us-east-1',
        credentials: expect.any(Object),
      },
      lexV1: expect.any(Object),
      lexV2: expect.any(Object),
      polly: expect.any(Object),
      username: undefined,
      Login: 'https://login.com',
      idtoken: undefined,
    });
  });
});