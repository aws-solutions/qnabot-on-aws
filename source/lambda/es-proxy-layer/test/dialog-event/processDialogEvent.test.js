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



