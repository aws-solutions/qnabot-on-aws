/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const jwt = require('../../../lib/middleware/jwt');
const jwtFixtures = require('./jwt.fixtures')
const jsonwebtoken = require('jsonwebtoken');
jest.mock('jwks-rsa');
const jwksClient = require('jwks-rsa');
jest.mock('jsonwebtoken');

jwksClient.mockImplementation((_) => {
    return {
        getSigningKey: (kid) => {
            return {
                getPublicKey: jest.fn(() => {
                    return "publicKey";
                }),
                'publicKey': 'fakePublicKey'
            }
        },
    }
});

describe('when calling decode function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should successfully decode the token', () => {
        jsonwebtoken.decode.mockReturnValue(jwtFixtures.jwtDecodeResponse);
        let decodedToken = jwt.decode('mock_jwt_token');
        expect(decodedToken).toEqual(jwtFixtures.decodedJwt);
    });

    test('should return if unable to decode the token', () => {
        jsonwebtoken.decode.mockReturnValue(null);
        let decodedToken = jwt.decode('mock_jwt_token');
        expect(decodedToken).toEqual(null);
    });

    test('error parsing token payload', () => {
        const mockDecodeResponse = {
            "payload": "payload",
            "signature": "mock_signature"
        }
        jsonwebtoken.decode.mockReturnValue(mockDecodeResponse);
        let decodedToken = jwt.decode('mock_jwt_token');
        expect(decodedToken).toEqual({
            "payload": "payload",
            "signature": "mock_signature"
        });

        mockDecodeResponse.payload = undefined;
        decodedToken = jwt.decode('mock_jwt_token');
        expect(decodedToken).toEqual({
            "payload": undefined,
            "signature": "mock_signature",
        });
    });
});

describe('when calling verify function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });
    
    test('should be able to verify the token', async () => {
        jsonwebtoken.decode.mockReturnValue(jwtFixtures.jwtDecodeResponse);
        jsonwebtoken.verify.mockResolvedValue(null);
        const verified = await jwt.verify("mock_jwt_token", "mock_kid", ["https://cognito-idp.us-east-1.amazonaws.com"]);
        expect(verified).toEqual("https://cognito-idp.us-east-1.amazonaws.com");
    });

    test('should return false if token is invalid', async () => {
        jsonwebtoken.decode.mockReturnValue(jwtFixtures.jwtDecodeResponse);
        jsonwebtoken.verify.mockImplementation(() => {
            throw new Error('Mock Invalid token error');
        });
        const verified = await jwt.verify("mock_jwt_token", "mock_kid", ["https://cognito-idp.us-east-1.amazonaws.com"]);
        expect(verified).toEqual(false);
    });

    test('should return false if signing key is empty or undefined', async () => {
        jsonwebtoken.decode.mockReturnValue(jwtFixtures.jwtDecodeResponse);
        jwksClient.mockImplementation((_) => {
            return {
                getSigningKey: (kid) => {
                    return {
                        getPublicKey: jest.fn(() => {
                            return "";
                        }),
                        "publicKey": ""
                    }
                },
            }
        });
        const verified = await jwt.verify("mock_jwt_token", "mock_kid", ["https://cognito-idp.us-east-1.amazonaws.com"]);
        expect(verified).toEqual(false);
    });
});

