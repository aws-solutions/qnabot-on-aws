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

const qnabot = require('qnabot/logging');
const llm = require('../llm');

function prependLlmQaAnswer(prefix, qa_answer, hit) {
    // prepend sm answer to plaintext and markdown
    hit.a = [qa_answer, hit.a].join('\n\n');
    hit.alt.markdown = [qa_answer, hit.alt.markdown].join('\n\n');
    // replace ssml with just the short answer for concise voice responses
    hit.alt.ssml = `<speak>${qa_answer}</speak>`;

    prefix = prefix.trim();
    if (prefix) {
        hit.a = [prefix, hit.a].join('\n\n');
        hit.alt.markdown = [`**${prefix}**`, hit.alt.markdown].join('\n\n');
    }
    qnabot.log('modified hit:', JSON.stringify(hit));
    return hit;
}

async function runLlmQa(req, hit) {
    const errors = [];
    if (!req._settings.LLM_QA_ENABLE) {
        // nothing to do
        return [hit, errors];
    }

    // LLM_QA_ENABLE is TRUE
    const debug = req._settings.ENABLE_DEBUG_RESPONSES;
    const context = hit.a;
    if (!req._settings.LLM_QA_SHOW_CONTEXT_TEXT) {
        // remove context text.. hit will contain only the QA Summary output
        hit.a = '';
        hit.alt.markdown = '';
        hit.alt.ssml = '';
    } else {
        // Context provided only in markdown channel (excluded from chat memory)
        hit.a = '';
        const ctx = llm.clean_context(hit.alt.markdown, req);
        hit.alt.markdown = `<details>
        <summary>Context</summary>
        <p style="white-space: pre-line;">${ctx}</p>
        </details>
        <br>
        `;
        qnabot.debug(`Markdown: ${hit.alt.markdown}`);
        hit.alt.ssml = '';
    }

    if (hit.refMarkdown && req._settings.LLM_QA_SHOW_SOURCE_LINKS) {
        hit.alt.markdown = `${hit.alt.markdown}\n${hit.refMarkdown}`;
    }

    const start = Date.now();
    let answer;
    try {
        answer = await llm.get_qa(req, context);
    } catch (e) {
        qnabot.warn(`[ERROR] Fatal LLM Exception, please check logs for details: ${e.message}`);
        qnabot.warn('[INFO] Setting hits to undefined to trigger no_hits workflow');
        hit = undefined;
        errors.push(e.message);
        qnabot.log(`Error Log Errors: ${JSON.stringify(errors)}`);
        return [hit, errors];
    }
    const end = Date.now();
    const timing = debug ? `(${end - start} ms)` : '';
    // check for 'don't know' response from LLM and convert to no_hits behavior if pattern matches
    const no_hits_regex = req._settings.LLM_QA_NO_HITS_REGEX || 'Sorry, I don\'t know';
    const no_hits_res = answer.search(new RegExp(no_hits_regex, 'g'));
    if (no_hits_res < 0) {
        let llm_qa_prefix = '';
        if (req._settings.LLM_QA_PREFIX_MESSAGE) {
            llm_qa_prefix = `${req._settings.LLM_QA_PREFIX_MESSAGE} ${timing}`;
        }

        hit = prependLlmQaAnswer(llm_qa_prefix, answer, hit);
        hit.debug.push(`LLM: ${req._settings.LLM_API}`);
    } else {
        qnabot.log(`No Hits pattern returned by LLM: "${no_hits_regex}"`);
        hit = undefined;
    }

    return [hit, errors];
}
exports.runLlmQa = runLlmQa;
