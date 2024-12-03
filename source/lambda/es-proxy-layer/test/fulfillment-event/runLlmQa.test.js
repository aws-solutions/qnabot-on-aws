/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const llm = require('../../lib/llm');
const { runLlmQa } = require('../../lib/fulfillment-event/runLlmQa');


jest.mock('qnabot/settings');
jest.mock('qnabot/logging');
jest.mock('../../lib/llm');


describe('runLlmQa', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        llm.get_qa.mockReset();
        llm.clean_context.mockImplementation(() => {
            return 'context'
        });
        llm.get_qa.mockImplementation(() => {
            return 'answer'
        });
    })

    test('formats LLM response', async () => {
        const req = {
            _settings: {
                LLM_QA_SHOW_CONTEXT_TEXT: true,
                LLM_QA_SHOW_SOURCE_LINKS: true,
                LLM_QA_ENABLE: true,
                ENABLE_DEBUG_RESPONSES: true,
                LLM_QA_NO_HITS_REGEX: 'no hits',
                LLM_QA_PREFIX_MESSAGE: 'prefix message',
                LLM_API: 'LLM'
            }
        };

        const hit = {
            alt: {
                markdown: 'markdown',
            },
            refMarkdown: 'ref markdown',
            debug: [],
        };

        const response = await runLlmQa(req, hit);

        expect(response[0].a).toContain('prefix message');
        expect(response[0].a).toContain('answer');
        expect(response[0].a).toContain('ms)');
        expect(response[0].alt.markdown).toContain('prefix message');
        expect(response[0].alt.markdown).toContain('answer');
        expect(response[0].alt.markdown).toContain('<summary>Context</summary>');
        expect(response[0].alt.markdown).toContain('ref markdown');
        expect(response[0].alt.ssml).toBe('<speak>answer</speak>');
        expect(response[0].debug).toStrictEqual(['LLM: LLM']);
        expect(response[1]).toStrictEqual([]);
    });

    test('hit does not contain context if show context text not enabled', async () => {
        const req = {
            _settings: {
                LLM_QA_SHOW_CONTEXT_TEXT: false,
                LLM_QA_SHOW_SOURCE_LINKS: true,
                LLM_QA_ENABLE: true,
                ENABLE_DEBUG_RESPONSES: false,
                LLM_API: 'LLM'
            }
        };

        const hit = {
            alt: {},
            debug: [],
        };

        const response = await runLlmQa(req, hit);

        expect(response[0].alt.markdown).toBe('answer\n\n');
        expect(response[0].a).not.toContain('ms)');
        expect(response[0].alt.markdown).not.toContain('<summary>Context</summary>');
        expect(response[1]).toStrictEqual([]);
    });

    test('returns undefined hit if LLM results in no hits response', async () => {
        const req = {
            _settings: {
                LLM_QA_SHOW_CONTEXT_TEXT: false,
                LLM_QA_SHOW_SOURCE_LINKS: true,
                LLM_QA_ENABLE: true,
                ENABLE_DEBUG_RESPONSES: true,
                LLM_QA_NO_HITS_REGEX: 'no hits',
                LLM_API: 'LLM'
            }
        };

        const hit = {
            alt: {},
            debug: [],
        };

        llm.get_qa.mockImplementation(() => {
            return 'no hits'
        });
        llm.isNoHits.mockImplementation(() => {
            return true;
        });

        const response = await runLlmQa(req, hit);

        expect(response[0]).toBe(undefined);
        expect(response[1]).toStrictEqual([]);
    });

    test('handles errors from LLM', async () => {
        const req = {
            _settings: {
                LLM_QA_SHOW_CONTEXT_TEXT: false,
                LLM_QA_SHOW_SOURCE_LINKS: true,
                LLM_QA_ENABLE: true,
                ENABLE_DEBUG_RESPONSES: true,
                LLM_QA_NO_HITS_REGEX: 'no hits',
                LLM_QA_PREFIX_MESSAGE: 'prefix message',
                LLM_API: 'LLM'
            }
        };

        const hit = {
            alt: {},
            debug: [],
        };

        llm.get_qa.mockImplementation(() => {
            throw new Error('test error')
        });

        const response = await runLlmQa(req, hit);

        expect(response[0]).toBe(undefined);
        expect(response[1]).toStrictEqual(['test error']);
    });

    test('exits early if LLM is not enabled', async () => {
        const req = {
            _settings: {
                LLM_QA_ENABLE: false,
            }
        };

        const hit = {
            alt: {
                markdown: 'markdown',
            },
            debug: [],
        };

        const response = await runLlmQa(req, hit);

        expect(response[0]).toBe(hit);
        expect(response[1]).toStrictEqual([]);
    });

})
