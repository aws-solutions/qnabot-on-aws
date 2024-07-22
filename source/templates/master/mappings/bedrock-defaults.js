/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const amazonQueryPromptTemplate = 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.<br>Chat History: <br>{history}<br>Follow up question: {input}<br>Standalone question:';
const amazonQAPromptTemplate = '<br><br>Human: You are a friendly AI assistant. Answer the question in <question> tags only based on the provided reference passages. Here are reference passages in <references> tags:<br><references><br>{context}<br></references><br>If the references contain the information needed to respond, then write a confident response in under 50 words, quoting the relevant references. <br>Otherwise, if you can make an informed guess based on the reference passages, then write a less confident response in under 50 words, stating your assumptions.<br>Finally, if the references do not have any relevant information, then respond saying \\"Sorry, I don\'t know\\".<br><question><br>{query}<br></question><br><br>Assistant: According to the reference passages, in under 50 words:';
const anthropicQueryPromptTemplate = '<br><br>Human: Here is a chat history in <chatHistory> tags:<br><chatHistory><br>{history}<br></chatHistory><br>Human: And here is a follow up question or statement from the human in <followUpMessage> tags:<br><followUpMessage><br>{input}<br></followUpMessage><br>Human: Rephrase the follow up question or statement as a standalone question or statement that makes sense without reading the chat history.<br><br>Assistant: Here is the rephrased follow up question or statement:';
const ai21QAPromptTemplate = 'The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know. Documents: {context} Instruction: Based on the above documents, provide a detailed answer for {query} Answer \\"Sorry, I don\'t know\\" if not present in the document. Solution:';
const anthropicNoHitsRegex = '(Sorry, I don\'t know|unable to assist you|i don\'t have enough context|i could not find an exact answer|no information in the search results|search results do not contain|no information in the provided search results|not find any information|search results did not contain|unable to respond|There is no mention of|documents do not mention anything|There is no information provided|reference passages do not mention)';

module.exports = {
    BedrockDefaults: {
        'amazon.titan-embed-text-v1': {
            ModelID: 'amazon.titan-embed-text-v1',
            MaxTokens: 8000,
            EmbeddingsDimensions: 1536,
        },
        'amazon.titan-text-express-v1': {
            ModelID: 'amazon.titan-text-express-v1',
            MaxTokens: 8000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'amazon.titan-text-lite-v1': {
            ModelID: 'amazon.titan-text-lite-v1',
            MaxTokens: 4000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'ai21.j2-ultra-v1': {
            ModelID: 'ai21.j2-ultra-v1',
            MaxTokens: 8191,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: ai21QAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'ai21.j2-mid-v1': {
            ModelID: 'ai21.j2-mid-v1',
            MaxTokens: 8191,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: ai21QAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'anthropic.claude-instant-v1': {
            ModelID: 'anthropic.claude-instant-v1',
            MaxTokens: 100000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'anthropic.claude-v2.1': {
            ModelID: 'anthropic.claude-v2:1',
            MaxTokens: 100000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'anthropic.claude-3-haiku-v1': {
            ModelID: 'anthropic.claude-3-haiku-20240307-v1:0',
            MaxTokens: 100000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'anthropic.claude-3-sonnet-v1': {
            ModelID: 'anthropic.claude-3-sonnet-20240229-v1:0',
            MaxTokens: 100000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'cohere.command-text-v14': {
            ModelID: 'cohere.command-text-v14',
            MaxTokens: 4000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'cohere.command-light-text-v14': {
            ModelID: 'cohere.command-light-text-v14',
            MaxTokens: 4000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
        'cohere.embed-english-v3': {
            ModelID: 'cohere.embed-english-v3',
            MaxTokens: 512,
            EmbeddingsDimensions: 1024,
        },
        'cohere.embed-multilingual-v3': {
            ModelID: 'cohere.embed-multilingual-v3',
            MaxTokens: 512,
            EmbeddingsDimensions: 1024,
        },
        'meta.llama3-8b-instruct-v1': {
            ModelID: 'meta.llama3-8b-instruct-v1:0',
            MaxTokens: 8000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
        },
    },
};
