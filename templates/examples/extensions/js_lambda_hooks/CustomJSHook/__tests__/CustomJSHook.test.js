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
