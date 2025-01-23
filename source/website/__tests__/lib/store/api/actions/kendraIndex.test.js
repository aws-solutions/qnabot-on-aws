/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
import mockedContext from "./mockedContext";

const kendraIndexModule = require('../../../../../js/lib/store/api/actions/kendraIndex');

describe('kendraIndex action test', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('startKendraV2Indexing', () => {
        kendraIndexModule.startKendraV2Indexing(mockedContext, {});
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.crawlerV2.href,
            method: 'post',
        });
    });

    test('getKendraIndexingStatus', () => {
        kendraIndexModule.getKendraIndexingStatus(mockedContext, {});
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: mockedContext.rootState.info._links.crawlerV2.href,
            method: 'get',
        });
    });
});
