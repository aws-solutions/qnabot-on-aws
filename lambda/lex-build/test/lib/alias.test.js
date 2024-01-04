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

const Alias = require('../../lib/alias');
const run = require('../../lib/run');
jest.mock('../../lib/run');
describe('When calling alias function', () => {

    test('Should set the values correctly from version and data', async () => {
        const version = '2.0';
        const data = {
            botName: 'bot-test',
            name: 'name-test'
        };

        const mockRun = {
            'checksum': 'checksum-test'
        };

        const runMock = run.mockImplementationOnce(() => {
            return mockRun;
        }).mockImplementation(() => {
            return {
                botName: data.botName,
                botVersion: version,
                name: data.name,
                checksum: 'checksum-test'
            };
        });

        await Alias(version, data);
        //CheckSum value is set to test-run, version is set to test, botName and name are set to bot-test and name-test respectively
        //Verify Run mock is called twice, once by getBotAlias and once by putBotAlias
        expect(run).toBeCalledTimes(2);
        expect(run).toBeCalledWith('getBotAlias', data);
        expect(run).toBeCalledWith('putBotAlias', {"botName": "bot-test", "botVersion": "2.0", "checksum": "checksum-test", "name": "name-test"})
        //verify params passed are same as data and version passed initially
        expect(runMock().botName).toEqual(data.botName);
        expect(runMock().name).toEqual(data.name);
        expect(runMock().botVersion).toEqual(version);
    });
});
