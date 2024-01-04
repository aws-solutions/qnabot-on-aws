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

const processSlotsFixtures = require('./processSlots.fixtures')
const { processSlots }= require('../../lib/dialog-event/processSlots');

describe('When calling processSlots function', () => {

    test('Should use slotValue from request and return response and do not cache', async () => {
        const res = {};
        const processSlotResponse = await processSlots(processSlotsFixtures.createRequestObject("What is QnABot?", true),
            res, processSlotsFixtures.returnHit(false));

        expect(processSlotResponse.slots.test).toEqual(5);
    });

    test('Should use slotValue from request and return response and do cache', async () => {
        const res = {
            "session": {
            }};
        const processSlotResponse = await processSlots(processSlotsFixtures.createRequestObject("What is QnABot?", true),
            res, processSlotsFixtures.returnHit(true));

        expect(processSlotResponse.slots.test).toEqual(5);

        expect(processSlotResponse.session.qnabotcontext.slot.test).toEqual(5);
    });

    test('Should use Cached Value from Response session', async () => {
        const processSlotResponse = await processSlots(processSlotsFixtures.createRequestObject("What is QnABot?", false),
            processSlotsFixtures.createResponseObjectWithSession, processSlotsFixtures.returnHit(true));

        expect(processSlotResponse.slots.test).toEqual(10);
    });

    test('Should set value to Null if request and response session does not have a value', async () => {
        const res = {};
        const processSlotResponse = await processSlots(processSlotsFixtures.createRequestObject("What is QnABot?", false),
            res, processSlotsFixtures.returnHit(true));

        expect(processSlotResponse.slots.test).toBeNull();
        expect(processSlotResponse.nextSlotToElicit).toEqual('test');
    });

    test('Should set value to Null if request and response session does not have a value and hit does not cache any value', async () => {
        const res = {};
        const processSlotResponse = await processSlots(processSlotsFixtures.createRequestObject("What is QnABot?", false),
            res, processSlotsFixtures.returnHit(false));

        expect(processSlotResponse.slots.test).toBeNull();
        expect(processSlotResponse.nextSlotToElicit).toEqual('test');
    });

    test('Should return response as is if hit does not contain slots', async () => {
        const empty_obj = {};
        const processSlotResponse = await processSlots(processSlotsFixtures.createRequestObject("What is QnABot?", false),
            empty_obj, empty_obj);

        expect(processSlotResponse).toMatchObject(empty_obj);
    })
});

