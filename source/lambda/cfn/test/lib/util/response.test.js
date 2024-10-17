/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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