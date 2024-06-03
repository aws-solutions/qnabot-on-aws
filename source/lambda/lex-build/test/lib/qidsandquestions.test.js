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

const qidAndQuestions = require('../../lib/qidsandquestions');
const { con } = require('/opt/opensearch-client/connection');
const esFixtures = require('./es.fixtures');
jest.mock('/opt/opensearch-client/connection');

describe('When calling qidsandquestions function', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.INDEX = 'test-index';
        process.env.ADDRESS = 'test-address';
    });

    test('Should return utterances when source type starts with qna', async () => {
        const params = {
            address: 'test-address'
        };

        const mockEs = jest.fn().mockImplementation(() => {
            return esFixtures.returnEsMock('qna');
        });
        const mockResponse = mockEs();

        con.mockImplementation(() => {
            return mockResponse;
        });

        const utterances = await qidAndQuestions(params);

        const qnaParamsOf0 = {
            enableQidIntent: false,
            q: ["What is QnABot?", "How is weather today?",],
            slots: []
        };

        const qnaParamsOf1 = {
            enableQidIntent: false,
            q: ["What is best place to see northern lights?", "What is Best Indian restaurant in US?"],
            slots: []
        };
        expect(con).toBeCalledTimes(1);
        expect(con).toBeCalledWith('test-address');
        expect(mockResponse.search).toHaveBeenCalledTimes(1);
        expect(mockResponse.search).toHaveBeenCalledWith({"body": {"_source": {"exclude": ["questions.q_vector", "a_vector"]}, "query": {"match_all": {}}}, "index": "test-index", "scroll": "10s"});
        expect(mockResponse.scroll).toHaveBeenCalledTimes(2);
        expect(mockResponse.scroll).toHaveBeenCalledWith({"scroll": "10s", "scrollId": "1.0"});
        expect(utterances.length).toEqual(2);
        expect(utterances[0].qid).toEqual('1');
        expect(utterances[0].type).toEqual('qna');
        expect(utterances[0].qna).toMatchObject(qnaParamsOf0);
        expect(utterances[0].slotType).toEqual({});
        expect(utterances[1].qid).toEqual('2');
        expect(utterances[1].type).toEqual('qna');
        expect(utterances[1].qna).toMatchObject(qnaParamsOf1);
        expect(utterances[1].slotType).toEqual({});
    });

    test('Should return utterances when source type starts with slotType', async () => {
        const params = {
            address: 'test-address'
        };

        const mockEs = jest.fn().mockImplementation(() => {
            return esFixtures.returnEsMock('slottype');
        });
        const mockResponse = mockEs();

        con.mockImplementation(() => {
            return mockResponse;
        });

        const utterances = await qidAndQuestions(params);

        const slotParams = {
            descr: '',
            resolutionStrategyRestrict: false,
            slotTypeValues: [],
            useForCustomVocabulary: false
        };

        expect(con).toBeCalledTimes(1);
        expect(con).toBeCalledWith('test-address');
        expect(mockResponse.search).toHaveBeenCalledTimes(1);
        expect(mockResponse.search).toHaveBeenCalledWith({"body": {"_source": {"exclude": ["questions.q_vector", "a_vector"]}, "query": {"match_all": {}}}, "index": "test-index", "scroll": "10s"});
        expect(mockResponse.scroll).toHaveBeenCalledTimes(2);
        expect(mockResponse.scroll).toHaveBeenCalledWith({"scroll": "10s", "scrollId": "1.0"});
        expect(utterances.length).toEqual(2);
        expect(utterances[0].qid).toEqual('1');
        expect(utterances[0].type).toEqual('slottype');
        expect(utterances[0].slotType).toMatchObject(slotParams);
        expect(utterances[0].qna).toEqual({});
        expect(utterances[1].qid).toEqual('2');
        expect(utterances[1].type).toEqual('slottype');
        expect(utterances[1].slotType).toMatchObject(slotParams);
        expect(utterances[1].qna).toEqual({});


    });

    test('Should return utterances when source type is none of above', async () => {
        const params = {
            address: 'test-address'
        };

        const mockEs = jest.fn().mockImplementation(() => {
            return esFixtures.returnEsMock('test');
        });
        const mockResponse = mockEs();

        con.mockImplementation(() => {
            return mockResponse;
        });

        const utterances = await qidAndQuestions(params);

        expect(con).toBeCalledTimes(1);
        expect(con).toBeCalledWith('test-address');
        expect(mockResponse.search).toHaveBeenCalledTimes(1);
        expect(mockResponse.search).toHaveBeenCalledWith({"body": {"_source": {"exclude": ["questions.q_vector", "a_vector"]}, "query": {"match_all": {}}}, "index": "test-index", "scroll": "10s"});
        expect(mockResponse.scroll).toHaveBeenCalledTimes(2);
        expect(mockResponse.scroll).toHaveBeenCalledWith({"scroll": "10s", "scrollId": "1.0"});
        expect(utterances.length).toEqual(2);
        expect(utterances[0].qid).toEqual('1');
        expect(utterances[0].type).toEqual('test');
        expect(utterances[0].qna).toEqual({});
        expect(utterances[0].slotType).toEqual({});
        expect(utterances[1].qid).toEqual('2');
        expect(utterances[1].type).toEqual('test');
        expect(utterances[1].qna).toEqual({});
        expect(utterances[1].slotType).toEqual({});
    });
});
