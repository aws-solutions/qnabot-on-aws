
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
const actionsModule = require('../../../../js/lib/store/page/actions');

describe('actions page test', () => {
    const mockedContext = {
        commit: jest.fn(),
        dispatch: jest.fn(),
        state: {},
    };

    beforeEach(() => {
        const stateDefault = {
            current: 5,
            total: 10,
            perpage: 1,
        };
        mockedContext.state = { ...stateDefault };
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('setMode mode == questions', () => {
        const mode = 'questions';
        actionsModule.setMode(mockedContext, mode);
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('setMode', mode);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('goToPage', mockedContext.state.current);
    });

    test('setMode', () => {
        const mode = 'test';
        actionsModule.setMode(mockedContext, mode);
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(0);
    });

    test('goToPage', async () => {
        const index = 5;
        await expect(actionsModule.goToPage(mockedContext, index)).resolves.not.toThrow();
        expect(mockedContext.commit).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('data/get', index, { root: true });
    });

    test('goToPage throws an error', async () => {
        const index = 5;
        const testError = new Error(('Failed to Build'));
        mockedContext.dispatch.mockImplementationOnce(() => {
            throw new Error('test error');
        });
        await expect(actionsModule.goToPage(mockedContext, index)).rejects.toEqual(testError);
        expect(mockedContext.commit).toHaveBeenCalledTimes(2);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('data/get', index, { root: true });
    });

    test('nextPage', () => {
        mockedContext.state.current = mockedContext.state.total - 3;
        actionsModule.nextPage(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('goToPage', mockedContext.state.total - 2);
    });

    test('nextPage at last page', () => {
        mockedContext.state.current = mockedContext.state.total - 1;
        actionsModule.nextPage(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('goToPage', mockedContext.state.total - 1);
    });

    test('previousPage', () => {
        mockedContext.state.current = 4;
        actionsModule.previousPage(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('goToPage', mockedContext.state.current - 1);
    });

    test('previousPage at first page', () => {
        mockedContext.state.current = 1;
        actionsModule.previousPage(mockedContext);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('goToPage', 0);
    });
});
