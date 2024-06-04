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

const query = require('../lib/query');
const awsMock = require('aws-sdk-client-mock');
const logging = require('qnabot/logging');
const { processFulfillmentEvent } = require('../lib/fulfillment-event/processFulfillmentEvent');
const { processDialogEvent } = require('../lib/dialog-event/processDialogEvent');

jest.mock('../lib/fulfillment-event/processFulfillmentEvent');
jest.mock('../lib/dialog-event/processDialogEvent');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

describe('query', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('Should route to processDialogEvent if invocationSource set to DialogCodeHook', async () => {
        const req = {
            invocationSource: 'DialogCodeHook'
        };
        const res = {
            test: 'object'
        }
        const response = await query(req, res);

        expect(processDialogEvent).toBeCalledWith({"invocationSource": "DialogCodeHook"}, {"test": "object"});
        expect(logging.debug).toBeCalledTimes(1);
    });

    test('Should route to processFulfillmentEvent if invocationSource is not set to DialogCodeHook', async () => {
        const req = {
            invocationSource: ''
        };
        const res = {
            test: 'object'
        }
        const response = await query(req, res);

        expect(processFulfillmentEvent).toBeCalledWith({"invocationSource": ""}, {"test": "object"});
        expect(logging.debug).toBeCalledTimes(1);
    });
});



