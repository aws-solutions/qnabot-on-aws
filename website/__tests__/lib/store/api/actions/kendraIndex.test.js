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
import mockedContext from "./mockedContext";

const kendraIndexModule = require('../../../../../js/lib/store/api/actions/kendraIndex');

describe('kendraIndex action test', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('startKendraIndexing', () => {
        kendraIndexModule.startKendraIndexing(mockedContext, {});
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith('_request', {
            url: `${mockedContext.rootState.info._links.crawler.href}/start?message=start&topic=${mockedContext.rootState.info.KendraCrawlerSnsTopic}`,
            method: 'post',
        });
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
