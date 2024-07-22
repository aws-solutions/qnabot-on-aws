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
const addModule = require('../../../../../js/lib/store/data/actions/add');
const util = require('../../../../../js/lib/store/data/actions/util');

jest.mock('../../../../../js/lib/store/data/actions/util');


describe('add data action', () => {
    const testToken = 'test-token';
    const mockedContext = {
        commit: jest.fn(),
        rootState: {
            bot: {
                status: 'Submitting',
                build: {
                    message: '',
                    token: '',
                    status: '',
                },
            },
        },
    };
    const mockedReadyResult = {
        token: testToken,
        status: 'READY',
    };
    const mockedBuildingResult = {
        token: testToken,
        status: 'BUILDING',
    };
    const mockedReadyInfo = {
        build: {
            token: testToken,
            status: 'READY',
            message: 'test message',
        },
    };
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('build with READY status', async () => {
        const testToken = 'test-token';

        util.api
            .mockResolvedValueOnce(mockedReadyResult)
            .mockResolvedValueOnce(mockedBuildingResult)
            .mockResolvedValueOnce(mockedReadyInfo);
        await addModule.build(mockedContext);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'botinfo');
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'build');
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'botinfo');
        expect(util.api).toHaveBeenCalledTimes(3);
    });

    test('add', async () => {
        const qa = 'score';
        await addModule.add(mockedContext, qa);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'update', 'score');
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('page/incrementTotal', null, { root: true });
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
    });
});
