
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
const getModule = require('../../../../../js/lib/store/data/actions/get');
const util = require('../../../../../js/lib/store/data/actions/util');


jest.mock('../../../../../js/lib/store/data/actions/util');

describe('get data action', () => {
    const mockedContext = {
        commit: jest.fn(),
        dispatch: jest.fn(),
    };

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('schema', async () => {
        util.api.mockResolvedValueOnce({});
        await getModule.schema(mockedContext);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'schema');
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('schema', {});
    });

    test('botinfo success', async () => {
        const mockValue = { value: '' };
        util.api.mockResolvedValue(mockValue);
        await getModule.botinfo(mockedContext);
        expect(util.api).toHaveBeenCalledTimes(2);
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'botinfo');
        expect(util.api).toHaveBeenCalledWith(mockedContext, 'alexa');
        expect(mockedContext.commit).toHaveBeenCalledTimes(2);
        expect(mockedContext.commit).toHaveBeenCalledWith('bot', mockValue, { root: true });
        expect(mockedContext.commit).toHaveBeenCalledWith('alexa', mockValue, { root: true });
    });

    test('botinfo failure', async () => {
        const resFunction = jest.fn();
        const rejFunction = jest.fn().mockImplementationOnce((err) => err.message);
        const expectedError = 'Failed get BotInfo';
        util.api.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await expect(getModule.botinfo(mockedContext).then(resFunction, rejFunction))
            .resolves.toBe(expectedError);
        expect(util.api).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledTimes(0);
    });

    test('getAll success', async () => {
        mockedContext.dispatch
            .mockResolvedValueOnce(1)
            .mockResolvedValueOnce(0);
        await getModule.getAll(mockedContext);
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('clearQA');
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('get', { page: 0 });
        expect(mockedContext.dispatch).toHaveBeenCalledWith('get', { page: 1 });
    });

    test('getAll failure', async () => {
        const mockedError = new Error('test error');
        mockedContext.commit.mockImplementationOnce(() => {
            throw mockedError;
        });
        await expect(getModule.getAll(mockedContext)).rejects.toBe(mockedError);
    });
});
