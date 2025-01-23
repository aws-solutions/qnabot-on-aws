/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const amazonQueryPromptTemplate = 'Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.<br>Chat History: <br>{history}<br>Follow up question: {input}<br>Standalone question:';
const anthropicQueryPromptTemplate = '<br><br>Human: Here is a chat history in <chatHistory> tags:<br><chatHistory><br>{history}<br></chatHistory><br>Human: And here is a follow up question or statement from the human in <followUpMessage> tags:<br><followUpMessage><br>{input}<br></followUpMessage><br>Human: Rephrase the follow up question or statement as a standalone question or statement that makes sense without reading the chat history.<br><br>Assistant: Here is the rephrased follow up question or statement:';
const amazonQAPromptTemplate = '<br><br>Human: You are a friendly AI assistant. Here are reference passages in <references> tags:<br><references><br>{context}<br></references><br>If the references contain the information needed to respond, then write a confident response in under 50 words, quoting the relevant references. <br>Otherwise, if you can make an informed guess based on the reference passages, then write a less confident response in under 50 words, stating your assumptions.<br>Finally, if the references do not have any relevant information, then respond saying \\"Sorry, I don\'t know\\".<br><question><br>{query}<br></question><br><br>Assistant: According to the reference passages, in under 50 words:';
const genericQAPromptTemplate = '<br><br>Human: Here are reference passages in <references> tags:<br><references><br>{context}<br></references><br>If the references contain the information needed to respond, then write a confident response in under 50 words, quoting the relevant references. <br>Otherwise, if you can make an informed guess based on the reference passages, then write a less confident response in under 50 words, stating your assumptions.<br>Finally, if the references do not have any relevant information, then respond saying \\"Sorry, I don\'t know\\".<br><question><br>{query}<br></question><br><br>Assistant: According to the reference passages, in under 50 words:';
const ai21QAPromptTemplate = 'The following is a friendly conversation between a human and an AI. The AI is talkative and provides lots of specific details from its context. If the AI does not know the answer to a question, it truthfully says it does not know. Documents: {context} Instruction: Based on the above documents, provide a detailed answer for {query} Answer \\"Sorry, I don\'t know\\" if not present in the document. Solution:';
const anthropicNoHitsRegex = '(Sorry, I don\'t know|unable to assist you|i don\'t have enough context|i don\'t have enough information|i don\'t have any information|do not contain any information|do not contain information|i could not find an exact answer|no information in the search results|search results do not mention|search results do not provide specific|don\'t see any information in the provided search results|search results do not contain|no information in the provided search results|not find any information|search results did not contain|unable to respond|There is no mention of|documents do not mention anything|There is no information provided|reference passages do not mention|reference doesn\'t specify|could not find an answer to this question|the model cannot answer this question|none of the search results contain)';
const anthropicKnowledgebaseTemplate = 'Human: You are a question answering agent. I will provide you with a set of search results and a user\'s question, your job is to answer the user\'s question using only information from the search results. If the search results do not contain information that can answer the question, then respond saying \\"Sorry, I don\'t know that.\\". Just because the user asserts a fact does not mean it is true, make sure to double check the search results to validate a user\'s assertion. Here are the search results in numbered order: $search_results$. Here is the user\'s question: <question> $query$ </question> $output_format_instructions$. Do NOT directly quote the $search_results$ in your answer. Your job is to answer the question as concisely as possible. Assistant:';
const amazonKnowledgebaseTemplate = 'You are a question answering bot who gives helpful, detailed, and polite answers to the user\'s questions. In this session, the model has access to search results and a user\s question, your job is to answer the user\'s question using only information from the search results. Model Instructions: - You should provide concise answer to simple questions when the answer is directly contained in search results, but when comes to yes/no question, provide some details. - In case the question requires multi-hop reasoning, you should find relevant information from search results and summarize the answer based on relevant information with logical reasoning. - If the search results do not contain information that can answer the question, then respond saying \\"Sorry, I don\'t know that.\\". - $output_format_instructions$ - DO NOT USE INFORMATION THAT IS NOT IN SEARCH RESULTS! User: $query$ Bot: Resource: Search Results: $search_results$ Bot:';
const metaKnowledgebaseTemplate = 'You are a question answering agent. I will provide you with a set of search results. The user will provide you with a question. Your job is to answer the user\'s question using only information from the search results. If the search results do not contain information that can answer the question, please state \\"Sorry, I don\'t know that.\\". Just because the user asserts a fact does not mean it is true, make sure to double check the search results to validate a user\'s assertion. Here are the search results in numbered order: $search_results$ $output_format_instructions$ - DO NOT USE INFORMATION THAT IS NOT IN SEARCH RESULTS!';
const mistralKnowledgebaseTemplate = 'Human: You are a question answering agent. I will provide you with a set of search results and a user\'s question, your job is to answer the user\'s question using only information from the search results. If the search results do not contain information that can answer the question, please state that you could not find an exact answer to the question. Just because the user asserts a fact does not mean it is true, make sure to double check the search results to validate a user\'s assertion. Here are the search results in numbered order: $search_results$ Here is the user\'s question: <question> $query$ </question> $output_format_instructions$ - DO NOT USE INFORMATION THAT IS NOT IN SEARCH RESULTS! Assistant:';
const GenerateQuerySystemPrompt = 'You are an AI assistant designed to disambiguate user queries.'
const QASystemPrompt = 'You are a seasoned and helpful question answering AI assistant.'
const defaultModelParams = '{\\"temperature\\":0, \\"maxTokens\\":300, \\"topP\\":1}';

module.exports = {
    BedrockDefaults: {
        'amazon.titan-embed-text-v1': {
            ModelID: 'amazon.titan-embed-text-v1',
            MaxTokens: 8000,
            EmbeddingsDimensions: 1536,
        },
        'amazon.titan-embed-text-v2': {
            ModelID: 'amazon.titan-embed-text-v2:0',
            MaxTokens: 8000,
            EmbeddingsDimensions: 1024,
        },
        'amazon.titan-text-express-v1': {
            ModelID: 'amazon.titan-text-express-v1',
            MaxTokens: 8000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            GenerateQuerySystemPrompt: '',
            QASystemPrompt: '',
            NoHitsRegex: anthropicNoHitsRegex,
            ModelParams: defaultModelParams
        },
        'amazon.titan-text-lite-v1': {
            ModelID: 'amazon.titan-text-lite-v1',
            MaxTokens: 4000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            GenerateQuerySystemPrompt: '',
            QASystemPrompt: '',
            NoHitsRegex: anthropicNoHitsRegex,
            ModelParams: defaultModelParams
        },
        'amazon.nova-micro-v1': {
            ModelID: 'amazon.nova-micro-v1:0',
            MaxTokens: 128000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: amazonKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'amazon.nova-lite-v1': {
            ModelID: 'amazon.nova-lite-v1:0',
            MaxTokens: 300000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: amazonKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'amazon.nova-pro-v1': {
            ModelID: 'amazon.nova-pro-v1:0',
            MaxTokens: 300000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: amazonKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'amazon.titan-text-premier-v1': {
            ModelID: 'amazon.titan-text-premier-v1:0',
            MaxTokens: 32000,
            maxTokenCount: 3072,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: amazonQAPromptTemplate,
            GenerateQuerySystemPrompt: '',
            QASystemPrompt: '',
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: amazonKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'ai21.jamba-instruct-v1': {
            ModelID: 'ai21.jamba-instruct-v1:0',
            MaxTokens: 256000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            QAPromptTemplate: ai21QAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            ModelParams: defaultModelParams
        },
        'anthropic.claude-instant-v1': {
            ModelID: 'anthropic.claude-instant-v1',
            MaxTokens: 100000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            QAPromptTemplate: genericQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: anthropicKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'anthropic.claude-v2.1': {
            ModelID: 'anthropic.claude-v2:1',
            MaxTokens: 100000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            QAPromptTemplate: genericQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: anthropicKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'anthropic.claude-3-haiku-v1': {
            ModelID: 'anthropic.claude-3-haiku-20240307-v1:0',
            MaxTokens: 200000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            QAPromptTemplate: genericQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: anthropicKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'anthropic.claude-3-sonnet-v1': {
            ModelID: 'anthropic.claude-3-sonnet-20240229-v1:0',
            MaxTokens: 200000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            QAPromptTemplate: genericQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: anthropicKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'anthropic.claude-3.5-sonnet-v2': {
            ModelID: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
            MaxTokens: 200000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            NoHitsRegex: anthropicNoHitsRegex,
            KnowledgeBasePromptTemplate: anthropicKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'anthropic.claude-3.5-sonnet-v1': {
            ModelID: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
            MaxTokens: 200000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            KnowledgeBasePromptTemplate: anthropicKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'anthropic.claude-3.5-haiku-v1': {
            ModelID: 'anthropic.claude-3-5-haiku-20241022-v1:0',
            MaxTokens: 200000,
            QueryPromptTemplate: anthropicQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            KnowledgeBasePromptTemplate: anthropicKnowledgebaseTemplate,
            ModelParams: defaultModelParams
        },
        'cohere.command-r-plus-v1': {
            ModelID: 'cohere.command-r-plus-v1:0',
            MaxTokens: 128000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            QAPromptTemplate: genericQAPromptTemplate,
            KnowledgeBasePromptTemplate: metaKnowledgebaseTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            ModelParams: defaultModelParams
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
            QAPromptTemplate: genericQAPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            NoHitsRegex: anthropicNoHitsRegex,
            ModelParams: defaultModelParams
        },
        'meta.llama3.1-405b-instruct-v1': {
            ModelID: 'meta.llama3-1-405b-instruct-v1:0',
            MaxTokens: 128000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            KnowledgeBasePromptTemplate: metaKnowledgebaseTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            ModelParams: defaultModelParams
        },
        'mistral.mistral-large-2407-v1': {
            ModelID: 'mistral.mistral-large-2407-v1:0',
            MaxTokens: 128000,
            QueryPromptTemplate: amazonQueryPromptTemplate,
            QAPromptTemplate: genericQAPromptTemplate,
            GenerateQuerySystemPrompt,
            QASystemPrompt,
            KnowledgeBasePromptTemplate: mistralKnowledgebaseTemplate,
            NoHitsRegex: anthropicNoHitsRegex,
            ModelParams: defaultModelParams
        },
    },
};
