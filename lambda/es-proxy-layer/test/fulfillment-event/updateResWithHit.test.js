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

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const { updateResWithHit } = require('../../lib/fulfillment-event/updateResWithHit');

const { 
    req,
    res,
    hit,
} = require('./updateResWithHit.fixtures')

jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

describe('updateResWithHit', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    })

    test('add hit to res (SSML response type)', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);

        const expectedRes = {...clonedRes};
        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expectedRes.type = 'SSML';
        expectedRes.tags = ['tag'];
        expectedRes.result = clonedHit;
        expectedRes.result.r.send = true;
        expectedRes.session.qnabot_qid = expectedRes.result.qid;
        expectedRes.session.qnabot_gotanswer = true;
        expectedRes.session.appContext = {};
        expectedRes.session.appContext.altMessages = expectedRes.result.alt;
        expectedRes.session.qnabotcontext.previous = {
            q: 'How can I publish Kindle books?',
            qid: 'qid',
        };
        expectedRes.session.qnabotcontext.navigation.hasParent = true;
        expectedRes.session.qnabotcontext.navigation.previous = ['test', 'Help'];
        expectedRes.card = clonedHit.r;
        expectedRes.card.send = true;
        expectedRes.answerSource = 'ELASTICSEARCH';
        expectedRes.message = expectedRes.result.alt.ssml;
        expectedRes.plainMessage = expectedRes.result.a;
        expectedRes.reprompt = {
            text: '<speak>rp<speak>',
            type: 'SSML'
        };

        expect(response).toStrictEqual(expectedRes);
    });

    test('renames answersource', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedHit.answersource = 'Kendra FAQ';

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expect(response.answerSource).toBe('KENDRA FAQ');
    });

    test('no ssml when ssml preferred response type', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedHit.alt.ssml = '';

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expect(response.type).toBe('PlainText');
        expect(response.plainMessage).toBe(clonedRes.result.a);
        expect(response.message).toBe(clonedRes.result.a);
    });

    test('with card defined', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedRes.card = {};
        const expectedCard = {...clonedHit.r, send: true};

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);
        expect(response.card).toStrictEqual(expectedCard);
        expect(response.card.send).toBe(true);
    });

    test('add hit with no previous', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedRes.session.qnabotcontext.navigation.previous = [];

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expect(response.session.qnabotcontext.navigation.previous).toStrictEqual(['Help']);
    });

    test('add hit with previous matching previous qid', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedRes.session.qnabotcontext.navigation.previous = ['Help'];

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expect(response.session.qnabotcontext.navigation.previous).toStrictEqual(['Help']);
    });

    test('trim previous array if too long', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedRes.session.qnabotcontext.navigation.previous = 'this is some long previous history array that should be trimmed'.split(' ');

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expect(response.session.qnabotcontext.navigation.previous).toStrictEqual(['is','some','long','previous','history','array','that','should','be','trimmed', 'Help']);
    });

    test('res does not have parent if next', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedHit.next = ['test'];

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expect(response.session.qnabotcontext.navigation.hasParent).toBe(false);
    });

    test('res does not have parent if next', () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedHit.next = ['test'];

        const response = updateResWithHit(clonedReq, clonedRes, clonedHit);

        expect(response.session.qnabotcontext.navigation.hasParent).toBe(false);
    });

})
