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
const gettersModule = require('../../../../js/lib/store/data/getters');

describe('getters data', () => {
    const testState = {
        QAs: [
            { qid: { text: '2' }, select: true, score: 0.8 },
            { qid: { text: '3' }, select: true, score: 0.9 },
            { qid: { text: '1' }, select: false, score: 0.5 },
            ],
    };
    const sortedQAsByQid = [
        { qid: { text: '1' }, select: false, score: 0.5 },
        { qid: { text: '2' }, select: true, score: 0.8 },
        { qid: { text: '3' }, select: true, score: 0.9 },
    ];
    const sortedQAsByScore = [
        { qid: { text: '3' }, select: true, score: 0.9 },
        { qid: { text: '2' }, select: true, score: 0.8 },
        { qid: { text: '1' }, select: false, score: 0.5 },
    ];

    test('selected', () => {
        const expectedResult = [true, true, false];
        expect(gettersModule.selected(testState)).toEqual(expectedResult);
    });

    test('QAList with page mode == "test"', () => {
        const rootGetters = {
            page: {
                mode: 'prod',
            },
        };
        expect(gettersModule.QAlist(testState, {}, rootGetters)).toEqual(sortedQAsByQid);
    });

    test('QAList with page mode !== "test"', () => {
        const rootGetters = {
            page: {
                mode: 'test',
            },
        };
        expect(gettersModule.QAlist(testState, {}, rootGetters)).toEqual(sortedQAsByScore);
    });
});
