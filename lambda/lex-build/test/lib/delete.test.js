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


const { bot } = require('../../lib/delete');
const { intent } = require('../../lib/delete');
const { slot } = require('../../lib/delete');
const run = require('../../lib/run');
jest.mock('../../lib/run');

describe('When calling delete function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should return all versions if everything passess successfully for bot', async () => {
        //Latest version is 4.0, $LATEST = 4.0
        const curVersion = 2.0;
        const arrToBeDeleted = [];
        const runMock = {
            'bots': [
                {
                    'version': 1.0
                },
                {
                    'version': 2.0
                },
                {
                    'version': 3.0
                },
                {
                    'version': 3.0
                },
                {
                    'version': 4.0
                }
            ]
        };

        run.mockImplementationOnce(() => {
            return runMock;
        }).mockImplementation((functionName, params) => {
            //Do not push if version is equal to latest (4.0)
            if (params.version === 4.0) {
                return arrToBeDeleted;
            } else {
                arrToBeDeleted.push(params.version);
                return arrToBeDeleted;
            }
        });

        await bot('test-bot', curVersion);

        expect(run).toBeCalledTimes(5);
        expect(run).toBeCalledWith('getBotVersions', {"name": "test-bot"});
        expect(run).toBeCalledWith('deleteBotVersion', {"name": "test-bot", "version": 1});
        expect(run).toBeCalledWith('deleteBotVersion', {"name": "test-bot", "version": 3});
        //The only values present in ArrToBeDeleted are 1, 3 and 3.
        expect(arrToBeDeleted.length).toEqual(3);
        expect(arrToBeDeleted).toEqual([1,3,3]);

    });

    test('Should return all versions if everything passess successfully for intent', async () => {
        //Latest version is 4.0, $LATEST = 4.0
        const curVersion = 2.0;
        const arrToBeDeleted = [];
        const runMock = {
            'intents': [
                {
                    'version': 1.0
                },
                {
                    'version': 2.0
                },
                {
                    'version': 3.0
                },
                {
                    'version': 3.0
                },
                {
                    'version': 4.0
                }
            ]
        };

        run.mockImplementationOnce(() => {
            return runMock;
        }).mockImplementation((functionName, params) => {
            //Do not push if version is equal to latest (4.0)
            if (params.version === 4.0) {
                return arrToBeDeleted;
            } else {
                arrToBeDeleted.push(params.version);
                return arrToBeDeleted;
            }
        });

        await intent('test-intent', curVersion);

        expect(run).toBeCalledTimes(5);
        expect(run).toBeCalledWith('getIntentVersions', {"name": "test-intent"});
        expect(run).toBeCalledWith('deleteIntentVersion', {"name": "test-intent", "version": 1});
        expect(run).toBeCalledWith('deleteIntentVersion', {"name": "test-intent", "version": 3});

        //The only values present in ArrToBeDeleted are 1, 3 and 3.
        expect(arrToBeDeleted.length).toEqual(3);
        expect(arrToBeDeleted).toEqual([1,3,3]);

    });

    test('Should return all versions if everything passess successfully for slot', async () => {
        //Latest version is 4.0, $LATEST = 4.0
        const curVersion = 2.0;
        const arrToBeDeleted = [];
        const runMock = {
            'slotTypes': [
                {
                    'version': 1.0
                },
                {
                    'version': 2.0
                },
                {
                    'version': 3.0
                },
                {
                    'version': 3.0
                },
                {
                    'version': 4.0
                }
            ]
        };

        run.mockImplementationOnce(() => {
            return runMock;
        }).mockImplementation((functionName, params) => {
            //Do not push if version is equal to latest (4.0)
            if (params.version === 4.0) {
                return arrToBeDeleted;
            } else {
                arrToBeDeleted.push(params.version);
                return arrToBeDeleted;
            }
        });

        await slot('test-slot', curVersion);

        expect(run).toBeCalledTimes(5);
        expect(run).toBeCalledWith('getSlotTypeVersions', {"name": "test-slot"});
        expect(run).toBeCalledWith('deleteSlotTypeVersion', {"name": "test-slot", "version": 1});
        expect(run).toBeCalledWith('deleteSlotTypeVersion', {"name": "test-slot", "version": 3});

        //The only values present in ArrToBeDeleted are 1, 3 and 3.
        expect(arrToBeDeleted.length).toEqual(3);
        expect(arrToBeDeleted).toEqual([1,3,3]);

    });

    test('Should throw error for bot', async () => {
        const curVersion = 2.0;
        //const error = new Error('Test Bot Error');

        run.mockImplementation(() => {
            throw new Error('Test Bot Error');
        });

        await expect(async () => {
            await bot('test-bot', curVersion);
        }).rejects.toThrowError();

        expect(run).toBeCalledTimes(1);
        expect(run).toBeCalledWith('getBotVersions', {"name": "test-bot"});
    });

    test('Should throw error for intent', async () => {
        const curVersion = 2.0;
        //const error = new Error('Test Bot Error');

        run.mockImplementation(() => {
            throw new Error('Test Intent Error');
        });

        await expect(async () => {
            await intent('test-intent', curVersion);
        }).rejects.toThrowError();

        expect(run).toBeCalledTimes(1);
        expect(run).toBeCalledWith('getIntentVersions', {"name": "test-intent"});
    });

    test('Should throw error for slot', async () => {
        const curVersion = 2.0;
        //const error = new Error('Test Bot Error');

        run.mockImplementation(() => {
            throw new Error('Test Slot Error');
        });

        await expect(async () => {
            await slot('test-slot', curVersion);
        }).rejects.toThrowError();

        expect(run).toBeCalledTimes(1);
        expect(run).toBeCalledWith('getSlotTypeVersions', {"name": "test-slot"});
    });
});
