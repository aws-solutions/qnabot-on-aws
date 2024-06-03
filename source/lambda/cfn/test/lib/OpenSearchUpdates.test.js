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

const { OpenSearchClient, UpdateDomainConfigCommand } = require('@aws-sdk/client-opensearch');
const { mockClient } = require('aws-sdk-client-mock');
const openSearchUpdates = require('../../lib/OpenSearchUpdates');
const openSearchUpdatesFixtures = require('./OpenSearchUpdates.fixtures');
const originalEnv = process.env;
const updateDomainConfigCommandMock = mockClient(OpenSearchClient);

describe('test OpenSearchUpdates', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        updateDomainConfigCommandMock.reset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should be able to execute CREATE", async () => {
        const openSearchUpdatesCut = new openSearchUpdates();
        const params = openSearchUpdatesFixtures.openSearchUpdatesObject();

        const callback = (error, result) => {
            expect(result).not.toBeNull();
        };

        updateDomainConfigCommandMock.on(UpdateDomainConfigCommand).resolves(params);

        await openSearchUpdatesCut.Create({}, callback);
    });  

    it("should return error if exception occurred on CREATE", async () => {
        const openSearchUpdatesCut = new openSearchUpdates();
        const params = openSearchUpdatesFixtures.openSearchUpdatesObject();

        const callback = (error, result) => {
            expect(error.message).toBe('mocked lambda error');
        };

        updateDomainConfigCommandMock.on(UpdateDomainConfigCommand).rejects('mocked lambda error');

        await openSearchUpdatesCut.Create(params, callback);
    });  
    
    it("should be able to execute UPDATE", async () => {
        const openSearchUpdatesCut = new openSearchUpdates();
        const params = openSearchUpdatesFixtures.openSearchUpdatesObject();
        const createSpy = jest.spyOn(openSearchUpdates.prototype, 'Create');

        const callback = (error, result) => {};

        await openSearchUpdatesCut.Update('testID', params, {}, callback);

        expect(createSpy).toHaveBeenCalledTimes(1); 
    });  

    it("should be able to execute DELETE", async () => {
        const openSearchUpdatesCut = new openSearchUpdates();
        const params = openSearchUpdatesFixtures.openSearchUpdatesObject();
        
        const callback = (error, result) => {
            expect(result).toBe('testID');
        };

        updateDomainConfigCommandMock.on(UpdateDomainConfigCommand).resolves(params);

        await openSearchUpdatesCut.Delete('testID', params, callback);
    });  

    it("should handle an error with UpdateDomainConfig API", async () => {
        const openSearchUpdatesCut = new openSearchUpdates();
        const params = openSearchUpdatesFixtures.openSearchUpdatesObject();
        
        const callback = (error, result, extraResult) => {
            expect(result).toBe('testID');
        };

        updateDomainConfigCommandMock.on(UpdateDomainConfigCommand).rejects('update api error');

        await openSearchUpdatesCut.Delete('testID', params, callback);
    });  
});