/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { mockClient } = require('aws-sdk-client-mock');
const { CognitoIdentityClient, GetIdentityPoolRolesCommand, SetIdentityPoolRolesCommand } = require('@aws-sdk/client-cognito-identity');
const cognitoRole = require('../../lib/CognitoRole');
const cognitoRoleFixtures = require('./CognitoRole.fixtures');
const cognitoIdentityClientMock = mockClient(CognitoIdentityClient);
const originalRegion = process.env.AWS_REGION;

describe('test CognitoRole class', () => {
    beforeEach(() => {
        process.env.AWS_REGION = 'us-east-1';
        cognitoIdentityClientMock.reset();
    });

    afterEach(() => {
        process.env.AWS_REGION = originalRegion;
        jest.clearAllMocks();
    });

    it("should be able to create a new cognito role", async () => {
        const cognitoRoleCut = new cognitoRole();
        const params = cognitoRoleFixtures.cognitoIdpParamsObject();
        const identityPoolRolesCommandObject = cognitoRoleFixtures.getIdentityPoolRolesCommandObject();

        const callback = (error, result) => {
            expect(result).toBe('RoleMapping');

            params.RoleMappings.forEach((x) => {
                expect('ClientId' in x).toBe(false);
                expect('UserPool' in x).toBe(false);
            });
        };

        cognitoIdentityClientMock.on(GetIdentityPoolRolesCommand).resolves(identityPoolRolesCommandObject);
        cognitoIdentityClientMock.on(SetIdentityPoolRolesCommand).resolves(identityPoolRolesCommandObject);

        await cognitoRoleCut.Create(params, callback);
    });  

    it("should call create when update is called", async () => {
        const cognitoRoleCut = new cognitoRole();
        const params = cognitoRoleFixtures.cognitoIdpParamsObject();
        const createSpy = jest.spyOn(cognitoRole.prototype, 'Create');

        const callback = (error, result) => {};

        await cognitoRoleCut.Update('mock_id', params, {}, callback);

        expect(createSpy).toHaveBeenCalledTimes(1); 
    });  

    it("should be able to delete a Cognito role", async () => {
        const cognitoRoleCut = new cognitoRole();
        const params = cognitoRoleFixtures.cognitoIdpParamsObject();
        const identityPoolRolesCommandObject = cognitoRoleFixtures.getIdentityPoolRolesCommandObject();
        
        const callback = (error, result) => {
            expect(JSON.stringify(identityPoolRolesCommandObject.RoleMappings)).toBe('{}');
            expect(result).toBe('RoleMapping');
        };

        cognitoIdentityClientMock.on(GetIdentityPoolRolesCommand).resolves(identityPoolRolesCommandObject);
        cognitoIdentityClientMock.on(SetIdentityPoolRolesCommand).resolves(identityPoolRolesCommandObject);
        
        await cognitoRoleCut.Delete('mock_id', params, callback);
    });      
    
    it("should return error if exception ocurred on Delete", async () => {
        const cognitoRoleCut = new cognitoRole();
        const params = cognitoRoleFixtures.cognitoIdpParamsObject();
        
        cognitoIdentityClientMock.on(GetIdentityPoolRolesCommand).rejects('mock_error');
        cognitoIdentityClientMock.on(SetIdentityPoolRolesCommand).rejects('mock_error');

        const callback = (error, result) => {
            expect(error.message).toBe('mock_error')
        };

        await cognitoRoleCut.Delete('mock_id', params, callback);
    });  
});