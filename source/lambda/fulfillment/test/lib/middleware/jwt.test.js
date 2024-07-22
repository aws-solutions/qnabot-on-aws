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

