/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
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
