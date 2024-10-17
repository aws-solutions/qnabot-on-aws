/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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

