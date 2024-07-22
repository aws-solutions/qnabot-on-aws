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

const run = require('../../lib/run');
const slot= require('../../lib/slot');
const intent = require('../../lib/intent');
const intentFallback = require('../../lib/intentFallback');
const alias = require('../../lib/alias');
const bot = require('../../lib/bot');
const status = require('../../lib/statusv1');
const wait = require('../../lib/wait');
const lexV1 = require('../../lib/lexv1bot');
jest.mock('../../lib/run');
jest.mock('../../lib/slot');
jest.mock('../../lib/intent');
jest.mock('../../lib/intentFallback');
jest.mock('../../lib/alias');
jest.mock('../../lib/bot');
jest.mock('../../lib/delete');
jest.mock('../../lib/statusv1');
jest.mock('../../lib/wait');

describe('When calling lexV1bot function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.SLOTTYPE = 'test-slot';
        process.env.INTENT = 'test-intent';
        process.env.INTENTFALLBACK = 'test-intentFallback';
        process.env.BOTNAME = 'test-bot';
        process.env.BOTALIAS = 'test-alias';
    });

    test('Should return successful response', async () => {
        run.mockImplementationOnce(() => {
            return {
                slots: [1, 3, 3],
                version: '3.0'
            };
        }).mockImplementationOnce(() => {
            return {
                intentVersion: '3.0',
                status: 'success'
            };
        }).mockImplementationOnce(() => {
            return {
                intentFallbackVersion: '2.0',
                status: 'success'
            };
        }).mockImplementation(() => {
            return {
                version: '3.0',
                status: 'READY'
            };
        });

        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        await expect(lexV1({})).resolves.not.toThrow();

        expect(status).toHaveBeenCalledTimes(4);
        expect(status).toHaveBeenCalledWith('Rebuilding Slot');
        expect(status).toHaveBeenCalledWith('Rebuilding Intent');
        expect(status).toHaveBeenCalledWith('Rebuilding IntentFallback');
        expect(status).toHaveBeenCalledWith('Rebuilding Lex V1 Bot');
        expect(run).toHaveBeenCalledTimes(4);
        expect(run).toHaveBeenCalledWith('getSlotType', {"name": "test-slot", "version": "$LATEST"});
        expect(run).toHaveBeenCalledWith('getIntent', {"name": "test-intent", "version": "$LATEST"});
        expect(run).toHaveBeenCalledWith('getIntent', {"name": "test-intentFallback", "version": "$LATEST"});
        expect(run).toHaveBeenCalledWith('getBot', {"name": "test-bot", "versionOrAlias": "$LATEST"});
        expect(slot).toHaveBeenCalledTimes(1);
        expect(slot).toHaveBeenCalledWith({}, {"slots": [1, 3, 3], "version": "3.0"});
        expect(intent).toHaveBeenCalledTimes(1);
        expect(intent).toHaveBeenCalledWith(undefined, {"intentVersion": "3.0", "status": "success"});
        expect(intentFallback).toHaveBeenCalledTimes(1);
        expect(intentFallback).toHaveBeenCalledWith(undefined, {"intentFallbackVersion": "2.0", "status": "success"});
        expect(bot).toHaveBeenCalledTimes(1);
        expect(bot).toHaveBeenCalledWith(undefined, {"status": "READY", "version": "3.0"});
        expect(alias).toHaveBeenCalledTimes(1);
        expect(alias).toHaveBeenCalledWith(undefined, {"botName": "test-bot", "name": "test-alias"});
        expect(wait).toHaveBeenCalledTimes(1);
        expect(setTimeout).toHaveBeenCalledTimes(1);
    });

    test('Should return error', async () => {
        run.mockImplementation(() => {
            return {
                slots: [1, 3, 3],
                version: '3.0'
            };
        })
        const error = new Error('Error building lexV1bot');
        slot.mockRejectedValue(error);

        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        await lexV1({})

        expect(status).toHaveBeenCalledTimes(2);
        expect(status).toHaveBeenCalledWith('Rebuilding Slot');
        expect(status).toHaveBeenCalledWith('Failed', 'Error building lexV1bot');
        expect(run).toHaveBeenCalledTimes(4);
        expect(run).toHaveBeenCalledWith('getSlotType', {"name": "test-slot", "version": "$LATEST"});
        expect(run).toHaveBeenCalledWith('getIntent', {"name": "test-intent", "version": "$LATEST"});
        expect(run).toHaveBeenCalledWith('getIntent', {"name": "test-intentFallback", "version": "$LATEST"});
        expect(run).toHaveBeenCalledWith('getBot', {"name": "test-bot", "versionOrAlias": "$LATEST"});
        expect(slot).toHaveBeenCalledTimes(1);
        expect(slot).toHaveBeenCalledWith({}, {"slots": [1, 3, 3], "version": "3.0"});
        expect(intent).toHaveBeenCalledTimes(0);
        expect(intentFallback).toHaveBeenCalledTimes(0);
        expect(bot).toHaveBeenCalledTimes(0);
        expect(alias).toHaveBeenCalledTimes(0);
        expect(wait).toHaveBeenCalledTimes(0);
        expect(setTimeout).toHaveBeenCalledTimes(0);
    });
});

