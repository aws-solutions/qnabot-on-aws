/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const { handler } = require('../hook');

beforeAll(() => {
    jest.useFakeTimers('modern');
});

test('test hook responds with correct greetings', async () => {
    let date = new Date('2023, 11, 6, 12:00:00');
    let eightHours = 8 * 60 * 60 * 1000;

    const greetings = ['good morning, ', 'good afternoon, ', 'good evening, '];

    greetings.forEach((greeting, i) => {
        const greetingDate = date.getTime() + eightHours * i;
        jest.setSystemTime(greetingDate);
        const event = {
            res: {
                message: 'world',
            },
        };
        const context = {};
        const resp = `${greeting}${event.res.message}`;
        const callback = (error, result) => {
            expect(result.res.message).toBe(resp);
        };
        handler(event, context, callback);
    });
});

afterAll(() => {
    jest.useRealTimers();
});