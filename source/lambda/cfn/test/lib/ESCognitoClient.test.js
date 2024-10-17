/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { mockClient } = require('aws-sdk-client-mock');
const { CognitoIdentityProviderClient, ListUserPoolClientsCommand, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
const originalEnv = process.env;
const esCognitoClient = require('../../lib/ESCognitoClient');
const esCognitoClientFixtures = require('./ESCognitoClient.fixtures');
const cognitoIdentityProviderClientMock = mockClient(CognitoIdentityProviderClient);

describe('test ESCognitoClient class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };
        
        cognitoIdentityProviderClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to get Cognito User Pool data on Create", async () => {
        const esCognitoClientCut = new esCognitoClient();
        const params = esCognitoClientFixtures.esCognitoClientObject();
        const listUserPoolClientObject = esCognitoClientFixtures.listUserPoolClientObject();
        const describeUserPoolClientObject = esCognitoClientFixtures.describeUserPoolClientObject();

        cognitoIdentityProviderClientMock.on(ListUserPoolClientsCommand).resolves(listUserPoolClientObject);
        cognitoIdentityProviderClientMock.on(DescribeUserPoolClientCommand).resolves(describeUserPoolClientObject);

        const callback = (error, result, resultInfo) => {
            expect(result).toBe('mock_client_id');
            expect(resultInfo).toBe(describeUserPoolClientObject.UserPoolClient);
        };

        await esCognitoClientCut.Create(params, callback);
    });  


    it("should call be equivalent to Create when Update is called", async () => {
        const esCognitoClientCut = new esCognitoClient();
        const params = esCognitoClientFixtures.esCognitoClientObject();
        const listUserPoolClientObject = esCognitoClientFixtures.listUserPoolClientObject();
        const describeUserPoolClientObject = esCognitoClientFixtures.describeUserPoolClientObject();

        cognitoIdentityProviderClientMock.on(ListUserPoolClientsCommand).resolves(listUserPoolClientObject);
        cognitoIdentityProviderClientMock.on(DescribeUserPoolClientCommand).resolves(describeUserPoolClientObject);

        const callback = (error, result, resultInfo) => {
            expect(result).toBe('mock_client_id');
            expect(resultInfo).toBe(describeUserPoolClientObject.UserPoolClient);
        };

        await esCognitoClientCut.Update('mock_id', params, {}, callback);
    });  

    it("should return error if exception ocurred on Create or Update", async () => {
        const esCognitoClientCut = new esCognitoClient();
        const params = esCognitoClientFixtures.esCognitoClientObject();
        
        cognitoIdentityProviderClientMock.on(ListUserPoolClientsCommand).rejects('mock_error');
        cognitoIdentityProviderClientMock.on(DescribeUserPoolClientCommand).rejects('mock_error');

        const createCallback = (error, result) => {
            expect(error.message).toBe('mock_error')
        };

        const updateCallback = (error, result) => {
            expect(error.message).toBe('mock_error')
        };

        await esCognitoClientCut.Create(params, createCallback);
        await esCognitoClientCut.Create(params, updateCallback);
    });  
});