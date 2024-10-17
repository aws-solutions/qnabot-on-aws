/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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



