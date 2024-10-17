/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const { processSlots } = require('../../lib/dialog-event/processSlots');
const { processDialogEvent } = require('../../lib/dialog-event/processDialogEvent');
const dialogEventFixtures = require('./processDialogEvent.fixtures');
const qnabot = require('qnabot/logging');
jest.mock('../../lib/es_query');
jest.mock('../../lib/dialog-event/processSlots');
jest.mock('qnabot/logging');

describe('When calling processDialogEvent function', () => {

    test('Should not set qid in response when request does not contains qid', async () => {
        const res = {
            'session': {
            }
        };
        const dialogResponse = await processDialogEvent(dialogEventFixtures.createRequestObject("What is QnABot?", false), res);

        expect(qnabot.warn).toBeCalledTimes(1);
        expect(dialogResponse.res).toMatchObject(res);
    });

    test('Should set qid in response when request contains qid', async () => {
        const res = {
            'session': {
            }
        };
        processSlots.mockReturnValue(res);
        const dialogResponse = await processDialogEvent(dialogEventFixtures.createRequestObject("What is QnABot?", true), res);

        expect(dialogResponse.res.session.qnabot_qid).toEqual(10);
    });

});



