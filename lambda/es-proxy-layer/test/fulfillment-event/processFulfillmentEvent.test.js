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
const translate = require('../../lib/translate');
const { getHit } = require('../../lib/fulfillment-event/getHit');
const { evaluateConditionalChaining } = require('../../lib/fulfillment-event/evaluateConditionalChaining');
const { processFulfillmentEvent } = require('../../lib/fulfillment-event/processFulfillmentEvent');

const { 
    req,
    res,
    hit,
} = require('./processFulfillmentEvent.fixtures')

jest.mock('../../lib/fulfillment-event/evaluateConditionalChaining');
jest.mock('../../lib/fulfillment-event/getHit');
jest.mock('../../lib/translate');
jest.mock('qnabot/settings');
jest.mock('qnabot/logging');

jest.mock('../../lib/llm', () => ({
    ...jest.requireActual('../../lib/llm'),
    generate_query: jest.fn().mockImplementation(async (req) => {
        req.question = 'llm response';
        req.llm_generated_query = {};
        req.llm_generated_query.orig = 'original';
        req.llm_generated_query.result = 'result';
        req.llm_generated_query.concatenated = 'concatenated';
        req.llm_generated_query.timing = 'timing';
        return req;
    }),
}));

describe('processFulfillmentEvent', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        evaluateConditionalChaining.mockImplementation(async (req, res) => {
            const clonedReq = _.cloneDeep(req);
            const clonedRes = _.cloneDeep(res);
            const clonedHit = _.cloneDeep(hit);
            clonedHit.a = 'chaining response'
            return [clonedReq, clonedRes, clonedHit, []];
        
        })
        
        getHit.mockImplementation(async (req, res) => {
            const clonedReq = _.cloneDeep(req);
            const clonedRes = _.cloneDeep(res);
            const clonedHit = _.cloneDeep(hit);
            return [clonedReq, clonedRes, clonedHit, []];
        });
        translate.translate_hit.mockImplementation((hit) => {
            const clonedHit = _.cloneDeep(hit);
            clonedHit.a = 'translated answer';
            clonedHit.alt.markdown = 'translated answer';
            clonedHit.alt.ssml = 'translated answer';
            return clonedHit;
        });
    })

    test('retrieves hit and adds to response object', async () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;
        const session = response.res.session;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Source: test] answer');
        expect(result.alt.markdown).toBe('*[User Input: \"How can I publish Kindle books?\", Source: test]*  \n\nmarkdown');
        expect(result.alt.ssml).toBe('<speak>User Input: \"How can I publish Kindle books?\", Source: test ssml</speak>');
        expect(result.answersource).toBe('test');
        expect(session.qnabot_qid).toBe('qid');
        expect(session.qnabot_gotanswer).toBe(true);
    });

    test('disable debug responses', async () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        clonedReq._settings.ENABLE_DEBUG_RESPONSES = false;

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;
        const session = response.res.session;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('answer');
        expect(result.alt.markdown).toBe('markdown');
        expect(result.alt.ssml).toBe('ssml');
        expect(result.answersource).toBe('test');
        expect(session.qnabot_qid).toBe('qid');
        expect(session.qnabot_gotanswer).toBe(true);
    });

    test('translates hit when multilanguage is enabled and userLocale is not en', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = true;
        clonedReq.session.qnabotcontext.userLocale = 'es';
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Translated to: \"How can I publish Kindle books?\", Source: test] translated answer');
        expect(result.alt.markdown).toBe('*[User Input: \"How can I publish Kindle books?\", Translated to: \"How can I publish Kindle books?\", Source: test]*  \n\ntranslated answer');
        expect(result.alt.ssml).toBe('<speak>User Input: \"How can I publish Kindle books?\", Translated to: \"How can I publish Kindle books?\", Source: test translated answer</speak>');
    });

    test('does not translate when multilanguage is disabled', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = false;
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Source: test] answer');
    });

    test('uses llm generated query', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_GENERATE_QUERY_ENABLE = true;
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"original\", LLM generated query (timing): \"result\", Search string: \"concatenated\", Source: test] answer');
        expect(result.alt.markdown).toBe('*[User Input: \"original\", LLM generated query (timing): \"result\", Search string: \"concatenated\", Source: test]*  \n\nmarkdown');
        expect(result.alt.ssml).toBe('<speak>User Input: \"original\", LLM generated query (timing): \"result\", Search string: \"concatenated\", Source: test ssml</speak>');
    });

    test('uses translated llm generated query', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_GENERATE_QUERY_ENABLE = true;
        clonedReq._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = true;
        clonedReq.session.qnabotcontext.userLocale = 'es';
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Translated to: \"original\", LLM generated query (timing): \"result\", Search string: \"concatenated\", Source: test] translated answer');
        expect(result.alt.markdown).toBe('*[User Input: "How can I publish Kindle books?", Translated to: "original", LLM generated query (timing): "result", Search string: "concatenated", Source: test]*  \n\ntranslated answer');
        expect(result.alt.ssml).toBe('<speak>User Input: \"How can I publish Kindle books?\", Translated to: \"original\", LLM generated query (timing): \"result\", Search string: \"concatenated\", Source: test translated answer</speak>');
    });

    test('handles empty messages in chat history', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_GENERATE_QUERY_ENABLE = true;
        clonedReq._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = true;
        clonedReq._settings.LLM_QA_PREFIX_MESSAGE = '';
        clonedReq.session.qnabotcontext.userLocale = 'es';
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedHit.a = '';
        getHit.mockImplementation(async (req, res) => {
            return [clonedReq, clonedRes, clonedHit, []];
        });

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Translated to: \"original\", LLM generated query (timing): \"result\", Search string: \"concatenated\", Source: test] translated answer');
        expect(result.alt.markdown).toBe('*[User Input: "How can I publish Kindle books?", Translated to: "original", LLM generated query (timing): "result", Search string: "concatenated", Source: test]*  \n\ntranslated answer');
        expect(result.alt.ssml).toBe('<speak>User Input: \"How can I publish Kindle books?\", Translated to: \"original\", LLM generated query (timing): \"result\", Search string: \"concatenated\", Source: test translated answer</speak>');
    });

    test('skips llm generated query if qid is provided', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_GENERATE_QUERY_ENABLE = true;
        clonedReq.question = 'qid::test';
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"qid::test\", Source: test] answer');
    });

    test('skips llm generated query if utterance in list of protected utterances', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_GENERATE_QUERY_ENABLE = true;
        clonedReq._settings.PROTECTED_UTTERANCES = 'test';
        clonedReq.question = 'test';
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"test\", Source: test] answer');
    });

    test('skips llm generated query if qid provided in req', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq._settings.LLM_GENERATE_QUERY_ENABLE = true;
        clonedReq.qid = 'test';
        const clonedRes = _.cloneDeep(res);

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Lex Intent matched QID \"test\", Source: test] answer');
    });

    test('evaluates conditional chaining', async () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);

        await ['ReadyForFulfillment', 'Close', 'Failed'].forEach(async (state) => {
            clonedRes.session.qnabotcontext.elicitResponse.chainingConfig = 'test';
            clonedRes.session.qnabotcontext.elicitResponse.progress = state;

            const response = await processFulfillmentEvent(clonedReq, clonedRes);
            const result = response.res.result;
    
            expect(evaluateConditionalChaining).toHaveBeenCalledWith(clonedReq, clonedRes, {a: ''}, 'test');
            expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Source: test] chaining response');
        })
    });

    test('evaluates conditional chaining and passes message', async () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        clonedRes.message = 'test'

        await ['ReadyForFulfillment', 'Close', 'Failed'].forEach(async (state) => {
            clonedRes.session.qnabotcontext.elicitResponse.chainingConfig = 'test';
            clonedRes.session.qnabotcontext.elicitResponse.progress = state;

            const response = await processFulfillmentEvent(clonedReq, clonedRes);
            const result = response.res.result;
    
            expect(evaluateConditionalChaining).toHaveBeenCalledWith(clonedReq, clonedRes, {a: 'test'}, 'test');
            expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Source: test] chaining response');
        })
    });

    test('executes conditional chaining from hit', async () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedRes.session.qnabotcontext.previous = undefined;
        const expectedHit = _.cloneDeep(clonedHit);
        expectedHit.conditionalChaining = 'test';
        getHit.mockImplementation(async (req, res) => {
            clonedHit.conditionalChaining = 'test';
            return [req, res, clonedHit, []];
        });

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(evaluateConditionalChaining).toHaveBeenCalledWith(clonedReq, clonedRes, expectedHit, 'test');
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Source: test] chaining response');
    });

    test('exits conditional chaining after 10 attempts', async () => {
        const clonedReq = _.cloneDeep(req);
        clonedReq.debug = ['debug'];
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        const expectedHit = _.cloneDeep(clonedHit);
        expectedHit.conditionalChaining = 'test';
        getHit.mockImplementation(async (req, res) => {
            clonedHit.conditionalChaining = 'test';
            return [req, res, clonedHit, []];
        });

        evaluateConditionalChaining.mockImplementation(async (req, res) => {
            clonedHit.a = 'chaining response';
            clonedHit.conditionalChaining = 'test';
            return [clonedReq, clonedRes, clonedHit, ['loop']];
        })

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(evaluateConditionalChaining).toHaveBeenCalledTimes(10);

        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\"[\"debug\"], Source: test, Errors: [\"loop\"]] chaining response');
    });

    test('uses no hits response when hit not found', async () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        clonedReq._settings.ENABLE_DEBUG_RESPONSES = 'false';
        getHit.mockImplementation(async (req, res) => {
            return [clonedReq, clonedRes, undefined, []];
        });

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Source: unknown] Sorry, I don\'t know that');
        expect(result.alt.markdown).toBe('*[User Input: "How can I publish Kindle books?", Source: unknown]*  \n\nSorry, I don\'t know that');
        expect(result.alt.ssml).toBe('<speak>User Input: \"How can I publish Kindle books?\", Source: unknown Sorry, I don\'t know that</speak>');
        expect(result.answersource).toBe(undefined);
    });

    test('no answer case', async () => {
        const clonedReq = _.cloneDeep(req);
        const clonedRes = _.cloneDeep(res);
        const clonedHit = _.cloneDeep(hit);
        clonedHit.a = '';
        clonedReq._settings.ENABLE_DEBUG_RESPONSES = 'false';
        getHit.mockImplementation(async (req, res) => {
            return [clonedReq, clonedRes, clonedHit, []];
        });

        const response = await processFulfillmentEvent(clonedReq, clonedRes);
        const result = response.res.result;

        expect(getHit).toHaveBeenCalledWith(clonedReq, clonedRes);
        expect(result.a).toBe('[User Input: \"How can I publish Kindle books?\", Source: test] ');
    });
});
