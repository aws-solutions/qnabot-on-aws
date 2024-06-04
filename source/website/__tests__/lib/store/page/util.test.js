
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
const utilModule = require('../../../../js/lib/store/page/util');

describe('util page', () => {
    const mockedContext = {
        dispatch: jest.fn(),
        commit: jest.fn(),
        handle: utilModule.handle,
        load: utilModule.load,
        state: {
            selectIds: ['1', '5'],
            QAs: [{}],
        },
    };

    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(jest.fn());
    });

    test('api', () => {
        const name = 'list';
        const args = {};
        utilModule.api(mockedContext, name, args);
        expect(mockedContext.dispatch).toHaveBeenCalledTimes(1);
        expect(mockedContext.dispatch).toHaveBeenCalledWith(`api/${name}`, args, { root: true });
    });

    test('parse', () => {
        const item = {
            score: 0.99,
            body: {
                r: {
                    title: 'test-title',
                    imageUrl: 'https://test-title.example.com',
                },
                qid: '1',
                a: 'this is the way',
                t: 'test-topic',
                q: [
                    'question 1',
                    'question 2',
                    'question 3',
                ],
            },
        };

        const expectedResult = {
            qid: {
                text: item.body.qid,
                tmp: item.body.qid,
            },
            answer: {
                text: item.body.a,
                tmp: item.body.a,
            },
            card: {
                text: JSON.stringify(item.body.r, null, 4),
                title: {
                    text: item.body.r.title,
                    tmp: item.body.r.title,
                },
                imageUrl: {
                    text: item.body.r.imageUrl,
                    tmp: item.body.r.imageUrl,
                },
            },
            topic: {
                text: item.body.t,
                tmp: item.body.t,
            },
            questions: [
                { text: item.body.q[0], tmp: item.body.q[0] },
                { text: item.body.q[1], tmp: item.body.q[1] },
                { text: item.body.q[2], tmp: item.body.q[2] },
            ],
            open: false,
            edit: false,
            select: true,
            deleting: false,
            score: item.score,
        };

        expect(utilModule.parse(item, mockedContext)).toEqual(expectedResult);
    });

    test('parse using defaults', () => {
        const item = {
            body: {
                qid: '4',
                a: 'this is the way',
                q: [
                    'question 1',
                    'question 2',
                    'question 3',
                ],
            },
        };
        const defaultR = {
            title: '',
            imageUrl: '',
        };

        const expectedResult = {
            qid: {
                text: item.body.qid,
                tmp: item.body.qid,
            },
            answer: {
                text: item.body.a,
                tmp: item.body.a,
            },
            card: {
                text: JSON.stringify(defaultR, null, 4),
                title: {
                    text: '',
                    tmp: '',
                },
                imageUrl: {
                    text: '',
                    tmp: '',
                },
            },
            topic: {
                text: '',
                tmp: '',
            },
            questions: [
                { text: item.body.q[0], tmp: item.body.q[0] },
                { text: item.body.q[1], tmp: item.body.q[1] },
                { text: item.body.q[2], tmp: item.body.q[2] },
            ],
            open: false,
            edit: false,
            select: false,
            deleting: false,
            score: 0,
        };

        expect(utilModule.parse(item, mockedContext)).toEqual(expectedResult);
    });

    test('handle', async () => {
        const reason = 'test reason';
        await expect(mockedContext.handle(reason)).rejects.toBe(reason);
        expect(mockedContext.commit).toHaveBeenCalledTimes(1);
        expect(mockedContext.commit).toHaveBeenCalledWith('setError', reason, { root: true });
    });

    test('load fails to access qa', async () => {
        const expectedError = new Error('Failed to load');
        jest.spyOn(Promise, 'resolve').mockResolvedValueOnce({});
        await expect(mockedContext.load([])).rejects.toEqual(expectedError);
        expect(mockedContext.commit).toHaveBeenCalledTimes(2);
        expect(mockedContext.commit).toHaveBeenCalledWith('startLoading');
        expect(mockedContext.commit).toHaveBeenCalledWith('stopLoading');
    });
});
