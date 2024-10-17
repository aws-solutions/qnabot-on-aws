/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { mockClient } = require('aws-sdk-client-mock');
const { CognitoIdentityProviderClient, CreateUserPoolDomainCommand, DeleteUserPoolDomainCommand } = require('@aws-sdk/client-cognito-identity-provider');
const originalEnv = process.env;
const cognitoDomain = require('../../lib/CognitoDomain');
const cognitoDomainFixtures = require('./CognitoDomain.fixtures');
const cognitoIdentityProviderClientMock = mockClient(CognitoIdentityProviderClient);

describe('test CognitoDomain class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        cognitoIdentityProviderClientMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to create a new user pool domain", async () => {
        const cognitoDomainCut = new cognitoDomain();
        const params = cognitoDomainFixtures.userPoolDomainCommandObject();

        const callback = (error, result) => {
            expect(result).not.toBeNull(); // The method it calls can return any number
        };

        cognitoIdentityProviderClientMock.on(CreateUserPoolDomainCommand).resolves(params);

        await cognitoDomainCut.Create({}, callback);
    });  

    it("should return error if exception occurred on Create", async () => {
        const cognitoDomainCut = new cognitoDomain();
        const params = cognitoDomainFixtures.userPoolDomainCommandObject();

        const callback = (error, result) => {
            expect(error.message).toBe('mocked lambda error');
        };

        cognitoIdentityProviderClientMock.on(CreateUserPoolDomainCommand).rejects('mocked lambda error');

        await cognitoDomainCut.Create(params, callback);
    });  
    
    it("should call create when update is called", async () => {
        const cognitoDomainCut = new cognitoDomain();
        const params = cognitoDomainFixtures.userPoolDomainCommandObject();
        const createSpy = jest.spyOn(cognitoDomain.prototype, 'Create');

        const callback = (error, result) => {};

        await cognitoDomainCut.Update('mock_id', params, {}, callback);

        expect(createSpy).toHaveBeenCalledTimes(1); 
    });  

    it("should be able to delete a user pool domain", async () => {
        const cognitoDomainCut = new cognitoDomain();
        const params = cognitoDomainFixtures.userPoolDomainCommandObject();
        
        const callback = (error, result) => {
            expect(result).toBe('mock_id');
        };

        cognitoIdentityProviderClientMock.on(DeleteUserPoolDomainCommand).resolves(params);

        await cognitoDomainCut.Delete('mock_id', params, callback);
    });  

    it("should return error if exception occurred on Delete", async () => {
        const cognitoDomainCut = new cognitoDomain();
        const params = cognitoDomainFixtures.userPoolDomainCommandObject();
        
        const callback = (error, result) => {
            expect(error.message).toBe('mocked lambda error');
        };

        cognitoIdentityProviderClientMock.on(DeleteUserPoolDomainCommand).rejects('mocked lambda error');

        await cognitoDomainCut.Delete('mock_id', params, callback);
    });  
});