/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const qnabot = require('qnabot/logging');
const { TokenTextSplitter } = require('langchain/text_splitter');
const { get_encoding } = require('@dqbd/tiktoken');

/**
 * Count number of tokens in a message.
 * @param {string} message - The message to count tokens for.
 * @returns {number} - The number of tokens in the message.
 */
function countTokens(message) {
    const encoder = get_encoding('gpt2');

    const tokens = encoder.encode(message);
    encoder.free();
    return tokens.length;
}

/**
 * Truncate a message by number of tokens.
 * @param {string} message - The message to truncate.
 * @param {number} chunkSize - The number of tokens to truncate by.
 * @returns {Promise<string>} - The truncated message.
 */
async function truncateByNumTokens(message, chunkSize) {
    const splitter = new TokenTextSplitter({
        encodingName: 'gpt2',
        chunkSize,
        chunkOverlap: 0,
    });

    const output = await splitter.createDocuments([message]);
    qnabot.debug('Token Splitter:', { fullOutput: output, pageContent: output[0].pageContent });
    return output[0].pageContent;
}

/**
 * Creates a prompt within a max token limit that selectively truncates the history (first) and context (second) from the prompt.
 * @param {string} promptTemplateStr - The prompt template string.
 * @param {PromptTemplate} promptTemplate - The prompt template.
 * @param {string} history - The chat history string.
 * @param {string} context - The context string.
 * @param {string} input - The input string.
 * @param {string} query - The query string.
 * @param {number} maxTokens - The maximum number of tokens.
 * @returns {Promise<string>} - The truncated prompt.
 */
async function createTruncatedPrompt(promptTemplateStr, promptTemplate, history, context, input, query, maxTokens) {
    const prompt = await promptTemplate.format({
        history,
        context,
        input,
        query,
    });

    const promptTokenCount = countTokens(prompt);
    if (maxTokens && promptTokenCount > maxTokens) {
        qnabot.log(
            `Prompt token count is ${promptTokenCount}, which is more than the setting limit: ${maxTokens}. Truncating...`
        );
        const diff = promptTokenCount - maxTokens;

        const historyTokenCount = promptTemplateStr.includes('{history}') ? countTokens(history) : 0;
        if (historyTokenCount > diff) {
            const truncatedHistory = await truncateByNumTokens(history, historyTokenCount - diff);
            qnabot.log(`Selectively truncating history. New history: ${truncatedHistory}`);
            return promptTemplate.format({
                history: truncatedHistory,
                context,
                input,
                query,
            });
        }
        qnabot.log(`Selectively removing history from prompt, since it is ${historyTokenCount} tokens long.`);

        const contextTokenCount = promptTemplateStr.includes('{context}') ? countTokens(context) : 0;
        if (historyTokenCount + contextTokenCount > diff) {
            const truncatedContext = await truncateByNumTokens(context, contextTokenCount - diff - historyTokenCount);
            qnabot.log(`Selectively truncating context. New context: ${truncatedContext}`);
            return promptTemplate.format({
                history: '',
                context: truncatedContext,
                input,
                query,
            });
        }

        throw new Error(
            `Unable to truncate prompt to be less than ${maxTokens} tokens long. Please check your prompt template and settings.`
        );
    }

    return prompt;
}

exports.countTokens = countTokens;
exports.truncateByNumTokens = truncateByNumTokens;
exports.createTruncatedPrompt = createTruncatedPrompt;
