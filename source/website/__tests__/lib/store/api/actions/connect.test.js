/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import mockedContext from './mockedContext';

const connect = require('../../../../../js/lib/store/api/actions/connect');

const contactFlow = {
    CallFlow: '',
    FileName: '',
    QnaFile: '',
};

describe('connect action test', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('dispatch', () => {
        mockedContext.dispatch.mockReturnValueOnce(contactFlow);
        const result = connect.getContactFlow(mockedContext);

        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.connect.href,
            method: 'get',
        });
        expect(result).toEqual(contactFlow);
    });
});
