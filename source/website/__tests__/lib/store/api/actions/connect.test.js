/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import { vi } from 'vitest';
import mockedContext from './mockedContext';

import connect from '../../../../../js/lib/store/api/actions/connect';

const contactFlow = {
    CallFlow: '',
    FileName: '',
    QnaFile: '',
};

describe('connect action test', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.spyOn(console, 'log').mockImplementation(vi.fn());
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
