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
const originalEnv = process.env;
const { handler } = require('../index');
const indexFixtures = require('./index.fixtures');
jest.mock('@smithy/node-http-handler');

jest.mock('https', () => ({
    methodToMock: {},
}));

const emitter = new EventEmitter();
emitter.write = indexFixtures.writeMock;
emitter.end = indexFixtures.endMock;

const context = {
    logStreamName: 'mock log stream name',
    invokedFunctionArn: 'arn:aws.*:lambda:test-this-1:1:function:mock',
    done: indexFixtures.doneMock
};

// TODO: Revisit the logic in the uncovered lines -- are the else if and else cases even being hit? The function
// fails before it gets to the else due to parsing errors on Lextype[1] and I don't see how targets[type[1]] can
// have a non-null value due to the same parsing error.
describe('test index class', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };

        indexFixtures.writeMock.mockRestore();;
        indexFixtures.doneMock.mockRestore();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should dispatch a lex event', async () => {
        const message = new Stream();
        const event = indexFixtures.event();

        const callback = (error, result) => {
            console.log("ERROR", error);
            console.log("RESULT", result);
        };

        httpsMock.request = jest.fn().mockImplementation((options, cb) => {
            cb(message);

            message.emit('end');
            return emitter;
        });

        await handler(event, context, callback);

        expect(indexFixtures.writeMock).toHaveBeenCalled();
        expect(indexFixtures.endMock).toHaveBeenCalled();
        expect(indexFixtures.doneMock).toHaveBeenCalled();
    });
});