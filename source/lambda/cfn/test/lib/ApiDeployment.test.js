/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { mockClient } = require('aws-sdk-client-mock');
const { APIGatewayClient, CreateDeploymentCommand, UpdateStageCommand, DeleteDeploymentCommand } = require('@aws-sdk/client-api-gateway');
const originalEnv = process.env;
const apiDeployment = require('../../lib/ApiDeployment');
const apiDeploymentFixtures = require('./ApiDeployment.fixtures');
const apiGatewayClientMock = mockClient(APIGatewayClient);

describe('test ApiDeployment class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };
        
        apiGatewayClientMock.reset();
    });

    afterEach(() => {
        jest.resetAllMocks();
        jest.clearAllMocks();
    });

    // TODO: Should add tests to hit uncovered lines by mocking time elapsed for retries. Also need
    // more coverage to hit the caught exception lines.
    it("should be able to create new API Deployment on Create", async () => {
        const apiDeploymentCut = new apiDeployment();
        const createDeploymentCommandObject = apiDeploymentFixtures.createDeploymentCommandObject();
        const params = apiDeploymentFixtures.apiDeploymentNoIdParamsObject();
        const updateSpy = jest.spyOn(apiDeployment.prototype, 'Update');
        
        const callback = (error, result) => {
            expect(result).toBe('mock_id');
        };

        apiGatewayClientMock.on(CreateDeploymentCommand).resolves(createDeploymentCommandObject);

        await apiDeploymentCut.Create(params, callback);

        expect(updateSpy).toHaveBeenCalledTimes(0); // We should only call Update if we provided the ApiDeploymentId in our params.
    });  

    it("should call Update when calling Create if an ApiDeploymentId is provided", async () => {
        const apiDeploymentCut = new apiDeployment();
        const createDeploymentCommandObject = apiDeploymentFixtures.createDeploymentCommandObject();
        const params = apiDeploymentFixtures.apiDeploymentWithIdParamsObject();
        const updateSpy = jest.spyOn(apiDeployment.prototype, 'Update');

        apiGatewayClientMock.on(CreateDeploymentCommand).resolves(createDeploymentCommandObject);
        const callback = (error, result) => {};

        await apiDeploymentCut.Create(params, callback);

        expect(updateSpy).toHaveBeenCalledTimes(1); 
    });  

    it("should return error if exception occurred on Create", async () => {
        const apiDeploymentCut = new apiDeployment();
        const params = apiDeploymentFixtures.apiDeploymentNoIdParamsObject();

        const callback = (error, result) => {
            expect(error.message).toBe('mocked_error');
        };

        apiGatewayClientMock.on(CreateDeploymentCommand).rejects('mocked_error');
        
        await apiDeploymentCut.Create(params, callback);
    });  

    it("should be able to create new API deployment on Update", async () => {
        const apiDeploymentCut = new apiDeployment();
        const createDeploymentCommandObject = apiDeploymentFixtures.createDeploymentCommandObject();
        const updateStageCommandObject = apiDeploymentFixtures.updateStageCommandObject();
        const params = apiDeploymentFixtures.apiDeploymentWithIdParamsObject();
        
        const callback = (error, result) => {
            expect(result).toBe('mock_id');
        };

        apiGatewayClientMock.on(CreateDeploymentCommand).resolves(createDeploymentCommandObject);
        apiGatewayClientMock.on(UpdateStageCommand).resolves(updateStageCommandObject);

        await apiDeploymentCut.Update('mock_id', params, {}, callback);
    });

    it("should catch error if error occurred on Update", async () => {
        const apiDeploymentCut = new apiDeployment();
        const createDeploymentCommandObject = apiDeploymentFixtures.createDeploymentCommandObject();
        const updateStageCommandObject = apiDeploymentFixtures.updateStageCommandObject();
        const params = apiDeploymentFixtures.apiDeploymentWithIdParamsObject();
        
        const callback = (error, result) => {
            expect(error.message).toBe('mock_error');
        };

        apiGatewayClientMock.on(CreateDeploymentCommand).resolves(createDeploymentCommandObject);
        apiGatewayClientMock.on(UpdateStageCommand).rejects('mock_error');

        await apiDeploymentCut.Update('mock_id', params, {}, callback);
    });

    it("should be able to delete an API deployment by ID on Delete", async () => {
        const apiDeploymentCut = new apiDeployment();
        const params = apiDeploymentFixtures.apiDeploymentWithIdParamsObject();
        
        const callback = (error, result) => {
            expect(result).toBe('mock_id');
        };

        apiGatewayClientMock.on(DeleteDeploymentCommand).resolves();

        await apiDeploymentCut.Delete('mock_id', params, callback);
    });
});