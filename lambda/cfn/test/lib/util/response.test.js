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

const { EventEmitter } = require('events');
const httpsMock = require("https");
const Stream = require('stream');
const response = require('../../../lib/util/response');
const responseFixtures = require('./response.fixtures');

jest.mock('https', () => ({
    methodToMock: {},
}));

const emitter = new EventEmitter();
emitter.write = responseFixtures.writeMock;
emitter.end = responseFixtures.endMock;

describe('test response class', () => {
    beforeEach(() => {
        responseFixtures.endMock.mockRestore();
        responseFixtures.writeMock.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should send a put request to the provided url', async () => {
        const responseObject = responseFixtures.responseObjecWithNulls();
        const message = new Stream();

        httpsMock.request = jest.fn().mockImplementation((options, cb) => {
            cb(message);

            message.emit('end');
            return emitter;
        });

        await response.send(responseObject);
        expect(responseFixtures.writeMock).toHaveBeenCalled();
        expect(responseFixtures.endMock).toHaveBeenCalled();
    });
    
    it("should reject a bad http request", async () => {
        const responseObject = responseFixtures.responseObject();        
        const message = new Stream();

        httpsMock.request = jest.fn().mockImplementation((options, cb) => {
            cb(message);

            message.emit('end');
            return emitter;
        });

        await response.send(responseObject);
        emitter.emit('error', 'error message');
        
        expect(responseFixtures.writeMock).toHaveBeenCalled();
        expect(responseFixtures.endMock).toHaveBeenCalled();
    });  
});