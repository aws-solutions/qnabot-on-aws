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

const Bot = require('../../lib/bot');
const run = require('../../lib/run');
const botFixtures = require('./bot.fixtures');
jest.mock('../../lib/run');

describe('When calling bot function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('Should return new_version when intentName[0] startsWith fulfillment_ and status is READY', async () => {
        const runMock = {
            'checksum': 'checksum-test',
            'version': '3.0'
        };
        run.mockImplementationOnce(() => {
            return runMock;
        }).mockImplementationOnce(() => {
            return runMock;
        }).mockImplementation(() => {
            return {
                status: 'READY'
            };
        });

        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        const dataObj = botFixtures.returnData(true, false);

        const newVersion = await Bot(botFixtures.returnVersionObj, dataObj);

        expect(run).toHaveBeenCalledTimes(3);
        expect(run).toHaveBeenCalledWith("putBot", dataObj);
        expect(run).toHaveBeenCalledWith("createBotVersion", {"checksum": "checksum-test", "name": "test-bot"});
        expect(run).toHaveBeenCalledWith("getBot", {"name": "test-bot", "versionOrAlias": "3.0"});
        expect(dataObj.status).toBeUndefined();
        expect(dataObj.failureReason).toBeUndefined();
        expect(dataObj.lastUpdatedDate).toBeUndefined();
        expect(dataObj.createdDate).toBeUndefined();
        expect(dataObj.version).toBeUndefined();
        expect(newVersion).toEqual(botFixtures.returnNewVersionValue);

        //Status is ready, so no need to delay
        expect(setTimeout).toHaveBeenCalledTimes(0);
    }, 10000);

    test('Should return new_version when intentName[0]startsWith fulfillment_ and length gt 1', async () => {
        const runMock = {
            'checksum': 'checksum-test',
            'version': '3.0'
        };

        run.mockImplementationOnce(() => {
            return runMock;
        }).mockImplementationOnce(() => {
            return runMock;
        }).mockImplementation(() => {
            return {
                status: 'READY'
            };
        });

        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        const dataObj = botFixtures.returnData(true, true);

        const newVersion = await Bot(botFixtures.returnVersionObj, dataObj);

        expect(run).toHaveBeenCalledTimes(3);
        expect(run).toHaveBeenCalledWith("putBot", dataObj);
        expect(run).toHaveBeenCalledWith("createBotVersion", {"checksum": "checksum-test", "name": "test-bot"});
        expect(run).toHaveBeenCalledWith("getBot", {"name": "test-bot", "versionOrAlias": "3.0"});
        expect(dataObj.status).toBeUndefined();
        expect(dataObj.failureReason).toBeUndefined();
        expect(dataObj.lastUpdatedDate).toBeUndefined();
        expect(dataObj.createdDate).toBeUndefined();
        expect(dataObj.version).toBeUndefined();
        expect(newVersion).toEqual(botFixtures.returnNewVersionValue);

        //Status is ready, so no need to delay
        expect(setTimeout).toHaveBeenCalledTimes(0);
    }, 10000);

    test('Should return new_version when intentName[0] does not startsWith fulfillment_', async () => {
        const runMock = {
            'checksum': 'checksum-test',
            'version': '3.0'
        };
        run.mockImplementationOnce(() => {
            return runMock;
        }).mockImplementationOnce(() => {
            return runMock;
        }).mockImplementation(() => {
            return {
                status: 'READY'
            };
        });

        jest.useFakeTimers();
        jest.spyOn(global, 'setTimeout');

        const dataObj = botFixtures.returnData(false, false);

        const newVersion = await Bot(botFixtures.returnVersionObj, dataObj);

        expect(run).toHaveBeenCalledTimes(3);
        expect(run).toHaveBeenCalledWith("putBot", dataObj);
        expect(run).toHaveBeenCalledWith("createBotVersion", {"checksum": "checksum-test", "name": "test-bot"});
        expect(run).toHaveBeenCalledWith("getBot", {"name": "test-bot", "versionOrAlias": "3.0"});
        expect(dataObj.status).toBeUndefined();
        expect(dataObj.failureReason).toBeUndefined();
        expect(dataObj.lastUpdatedDate).toBeUndefined();
        expect(dataObj.createdDate).toBeUndefined();
        expect(dataObj.version).toBeUndefined();
        expect(newVersion).toEqual(botFixtures.returnNewVersionValue);

        //Status is ready, so no need to delay
        expect(setTimeout).toHaveBeenCalledTimes(0);
    }, 10000);
});
