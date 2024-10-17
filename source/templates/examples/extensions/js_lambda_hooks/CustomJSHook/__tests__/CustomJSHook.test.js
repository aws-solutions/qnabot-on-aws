/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { handler } = require('../CustomJSHook');

describe('CustomJSHook', () => {
    it('it responds with custom response', () => {
        const event = {
            res: {
                message: 'Do not use this message',
            },
        };
        const context = {};
        const callback = (error, response) => {
            expect(response).toEqual({
                res: {
                    message: 'Hi! This is your Custom Javascript Hook speaking!',
                },
            });
        };
        handler(event, context, callback);
    });
});
