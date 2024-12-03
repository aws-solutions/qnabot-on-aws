/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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