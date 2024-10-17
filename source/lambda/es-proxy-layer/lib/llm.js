/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/* eslint-disable max-len, no-underscore-dangle */
const _ = require('lodash');
const { Lambda } = require('@aws-sdk/client-lambda');
const { SageMakerRuntime } = require('@aws-sdk/client-sagemaker-runtime');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');
const region = process.env.AWS_REGION || 'us-east-1';

const { ChatMessageHistory, BufferMemory } = require('langchain/memory');
const { PromptTemplate } = require('langchain/prompts');
const { createTruncatedPrompt } = require('./truncate');
const { invokeBedrockModel } = require('./bedrock/bedrockModels');
const { sanitize } = require('./sanitizeOutput');

//
// Private functions
//

const default_params_stg = '{"temperature":0}';
const default_human_prefix = 'Human';
const default_ai_prefix = 'AI';

// make QA prompt from template
async function make_qa_prompt(req, promptTemplateStr, context, input, query) {
    const chatMessageHistory = await chatMemoryParse(
        _.get(req._userInfo, 'chatMessageHistory', '[]'),
        req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES,
    );
    const memory = new BufferMemory({ chatHistory: chatMessageHistory });
    const { history } = await memory.loadMemoryVariables();
    const promptTemplate = new PromptTemplate({
        template: promptTemplateStr,
        inputVariables: ['history', 'context', 'input', 'query'],
    });
    const maxLength = parseInt(req._settings.LLM_PROMPT_MAX_TOKEN_LIMIT, 10);
    const prompt = await createTruncatedPrompt(
        promptTemplateStr,
        promptTemplate,
        history,
        context,
        input,
        query,
        maxLength
    );

    return [memory, history, promptTemplate, prompt];
}
// make generate query prompt from template
async function make_qenerate_query_prompt(req, promptTemplateStr) {
    const chatMessageHistory = await chatMemoryParse(
        _.get(req._userInfo, 'chatMessageHistory', '[]'),
        req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES,
    );
    const memory = new BufferMemory({ chatHistory: chatMessageHistory });
    const { history } = await memory.loadMemoryVariables();
    const promptTemplate = new PromptTemplate({
        template: promptTemplateStr,
        inputVariables: ['history', 'input'],
    });
    const maxLength = req._settings.LLM_PROMPT_MAX_TOKEN_LIMIT;
    const prompt = await createTruncatedPrompt(
        promptTemplateStr,
        promptTemplate,
        history,
        '',
        req.question,
        '',
        maxLength,
    );

    return [memory, history, promptTemplate, prompt];
}

// Invoke LLM via SageMaker endpoint running Sagemaker Jumpstart llama-2-13b-chat
async function invoke_sagemaker(prompt, model_params) {
    const sm = new SageMakerRuntime(customSdkConfig('C005', { region }));
    const body = JSON.stringify({
        inputs: prompt,
        parameters: model_params
    });
    let response;
    qnabot.log(`Invoking SageMaker endpoint: ${process.env.LLM_SAGEMAKERENDPOINT}`);
    try {
        const smres = await sm.invokeEndpoint({
            EndpointName: process.env.LLM_SAGEMAKERENDPOINT,
            ContentType: 'application/json',
            Body: body,
        });
        const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
        qnabot.log('SM response body:', sm_body);
        response = sm_body[0].generated_text;
    } catch (e) {
        qnabot.warn('EXCEPTION:', e.stack);
        throw new Error(`Sagemaker exception: ${e.message.substring(0, 500)}...`);
    }
    return sanitize(response);
}

// Invoke LLM via custom Lambda abstraction
async function invoke_lambda(prompt, model_params, settings) {
    const lambda = new Lambda(customSdkConfig('C006', { region }));
    const body = JSON.stringify({
        prompt,
        parameters: model_params,
        settings,
    });

    qnabot.log(`Invoking Lambda: ${process.env.LLM_LAMBDA_ARN}`);
    try {
        const lambdares = await lambda.invoke({
            FunctionName: process.env.LLM_LAMBDA_ARN,
            InvocationType: 'RequestResponse',
            Payload: body,
        });

        const payloadObj = Buffer.from(lambdares.Payload).toString();
        const payload = JSON.parse(payloadObj);
        qnabot.log('Lambda response payload:', payload);
        if (payload.generated_text) {
            const response = payload.generated_text;
            return sanitize(response);
        }

        qnabot.warn("ERROR: Lambda response error. Returned payload missing 'generated_text' property:", payload);
        if (payload.errorMessage) {
            throw new Error(payload.errorMessage);
        }
        throw new Error('LLM inference failed.');
    } catch (e) {
        qnabot.warn('EXCEPTION:', e.stack);
        throw new Error(`Lambda exception: ${e.message.substring(0, 500)}...`);
    }
}

async function invoke_bedrock(prompt, model_params, settings) {
    const modelId = settings.LLM_MODEL_ID;
    const guardrails = {};
    const guardrailIdentifier = settings.BEDROCK_GUARDRAIL_IDENTIFIER.trim();
    const guardrailVersion = settings.BEDROCK_GUARDRAIL_VERSION.toString();

    if (guardrailIdentifier !== '' && guardrailVersion !== '') {
        guardrails.guardrailIdentifier = guardrailIdentifier;
        guardrails.guardrailVersion = guardrailVersion;
    };  
    const response = await invokeBedrockModel(modelId, model_params, prompt, guardrails);
    qnabot.log(`Bedrock Invoke LLM Response: ${response}`);
    return sanitize(response);
};

function clean_standalone_query(query) {
    let clean_query = query;
    // remove preamble, if any
    clean_query = clean_query.replace(/^Here .*? the standalone question.*$/gim, '');
    // remove newlines
    clean_query = clean_query.replace(/\n/g, ' ');
    // No more than 1000 characters - for Kendra query compatibility - https://docs.aws.amazon.com/kendra/latest/dg/API_Query.html
    clean_query = clean_query.slice(0, 1000);
    // limit output to one question.. truncate any runaway answers that shouldn't be included in the query.
    const q_pos = clean_query.indexOf('?');
    if (q_pos > -1) {
        clean_query = clean_query.slice(0, q_pos + 1);
    }
    // trim leading or trailing whitespace
    clean_query = clean_query.trim();
    return clean_query;
}

//
// Exported functions
//

// clean unwanted text artifacts from the provided context..
const clean_context = function clean_context(context, req) {
    let clean_context = context;
    // remove URLS from Kendra passages
    clean_context = clean_context.replace(/^\s*Source Link:.*$/gm, ''); // NOSONAR - javascript:S5852 - input is user controlled and we have a limit on the number of characters
    // remove Kendra prefix messages
    if (req._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE) {
        clean_context = clean_context.replace(new RegExp(req._settings.ALT_SEARCH_KENDRA_ANSWER_MESSAGE, 'g'), '');
    }
    if (req._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE) {
        clean_context = clean_context.replace(new RegExp(req._settings.ALT_SEARCH_KENDRA_FAQ_MESSAGE, 'g'), '');
    }
    if (req._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE) {
        clean_context = clean_context.replace(new RegExp(req._settings.ALT_SEARCH_KENDRA_TOP_ANSWER_MESSAGE, 'g'), '');
    }
    return clean_context;
};

// LangChain chatMessageHistory serialize (to JSON) and parse (from JSON)
// Chat history persistance is maintained via userInfo, managed from query.js, and stored in DynamoDB with other userInfo.
async function chatMemorySerialise(chatMessageHistory, max = 50, human_prefix = default_human_prefix, ai_prefix = default_ai_prefix) {
    const messages = await chatMessageHistory.getMessages();
    const obj_messages = [];    
    for (const m of messages) {
        let role;
        if (m._getType() === 'human') {
            role = human_prefix;
        } else if (m._getType() === 'ai') {
            role = ai_prefix;
        } else {
            throw new Error(`Got unsupported message type: ${m}`);
        }
        obj_messages.push({ [role]: m.text });
    }
    return JSON.stringify(obj_messages.slice(-max));
}
async function chatMemoryParse(json_messages, max = 50) {
    const chatMessageHistory = new ChatMessageHistory();
    const obj_messages = JSON.parse(json_messages).slice(-max);
    qnabot.log(`Chat Message History (capped at ${max}): `, json_messages);
    for (const m of obj_messages) {
        if (default_human_prefix in m) {
            chatMessageHistory.addUserMessage(m.Human);
        } else if (default_ai_prefix in m) {
            chatMessageHistory.addAIChatMessage(m.AI);
        } else {
            throw new Error(`Got unsupported message type: ${JSON.stringify(m)}`);
        }
    }
    return chatMessageHistory;
}

// return the question to use in the QA prompt
function get_question(req) {
    const question = _.get(req, 'llm_generated_query.orig', req.question);
    return question;
}
function get_query(req) {
    const query = _.get(req, 'llm_generated_query.result', req.question);
    return query;
}

async function invokeLlm(llmType, prompt, model_params, settings) {
    switch (llmType) {
        case 'BEDROCK':
            return invoke_bedrock(prompt, model_params, settings);
        case 'SAGEMAKER':
            return invoke_sagemaker(prompt, model_params);
        case 'LAMBDA':
            return invoke_lambda(prompt, model_params, settings);
        default:
            throw new Error(`Error: Unsupported LLM_API type: ${llmType}`);
    }
}

// generate_query: re-write utterance using chat history if needed, to make it standalone from prior conversation context.
const generate_query = async function generate_query(req) {
    const llmType = req._settings.LLM_API;
    qnabot.log(
        `Use LLM (${llmType}) to convert a follow up question to a standalone search query containing required context from chat history`
    );
    const origQuestion = req.question;
    // NOSONAR TODO - Can this also tell me if a query is needed, or if the LLM/chatHistory already has the answer
    let promptTemplateStr =
        req._settings.LLM_GENERATE_QUERY_PROMPT_TEMPLATE ||
        '<br><br>Human: Given the following conversation and a follow up input, if the follow up input is a question please rephrase that question to be a standalone question, otherwise return the input unchanged.<br><br>Chat History:<br>{history}<br><br>Follow Up Input: {input}<br><br>Assistant:';
    promptTemplateStr = promptTemplateStr.replace(/<br>/gm, '\n');

    const model_params = JSON.parse(req._settings.LLM_GENERATE_QUERY_MODEL_PARAMS || default_params_stg);
    const settings = req._settings;
    const [, , , prompt] = await make_qenerate_query_prompt(req, promptTemplateStr);
    qnabot.log(`Prompt: \nGENERATE QUERY PROMPT==>\n${prompt}\n<==PROMPT`);

    const start = Date.now();
    let newQuery = await invokeLlm(llmType, prompt, model_params, settings);
    const end = Date.now();
    const timing = `${end - start} ms`;

    qnabot.debug(`LLM response before running clean_standalone_query(): ${newQuery}`);
    newQuery = clean_standalone_query(newQuery);
    const concatQuery = `${origQuestion} / ${newQuery}`;
    qnabot.log(
        `Original question: ${origQuestion} => New question: ${newQuery}. Use concatenation for retrieval query: ${concatQuery}`
    );
    req.question = concatQuery;
    req.llm_generated_query = {
        orig: origQuestion,
        result: newQuery,
        concatenated: concatQuery,
        timing,
    };
    return req;
};

const get_qa = async function get_qa(req, context) {
    qnabot.log(
        `LLM (${req._settings.LLM_API}) Retrieval Augmented Generation (RAG) to answer user's question from search result context.`
    );
    let promptTemplateStr =
        req._settings.LLM_QA_PROMPT_TEMPLATE ||
        '<br><br>Human: You are an AI chatbot. Carefully read the following context and conversation history and then provide a short answer to question at the end. If the answer cannot be determined from the history or the context, reply saying "Sorry, I don\'t know". <br><br>Context: {context}<br><br>History: <br>{history}<br><br>Human: {input}<br><br>Assistant:';
    promptTemplateStr = promptTemplateStr.replace(/<br>/gm, '\n');
    context = clean_context(context, req);
    const model_params = JSON.parse(req._settings.LLM_QA_MODEL_PARAMS || default_params_stg);
    const settings = req._settings;
    // parse and serialise chat history to manage max messages
    const input = get_question(req);
    const query = get_query(req);
    const llmType = req._settings.LLM_API;
    const [, , , prompt] = await make_qa_prompt(req, promptTemplateStr, context, input, query);
    qnabot.log(`QUESTION ANSWERING PROMPT: \nPROMPT==>\n${prompt}\n<==PROMPT`);

    const answer = await invokeLlm(llmType, prompt, model_params, settings);

    qnabot.log(`Question: ${req.question}`);
    qnabot.log(`Context: ${context}`);
    qnabot.log(`Answer: ${answer}`);
    return answer;
};

function isNoHits(req, answer) {
    const noHitsRegex = req._settings.LLM_QA_NO_HITS_REGEX || 'Sorry, I don\'t know';
    const noHitsRes = answer.search(new RegExp(noHitsRegex, 'gmi'));

    if (noHitsRes >= 0) {
        qnabot.log(`[DEBUG] LLM QA: ${answer} matched ${noHitsRegex}`);
        return true;
    }
    return false;
}

module.exports = {
    clean_context,
    chatMemorySerialise,
    chatMemoryParse,
    get_question,
    generate_query,
    get_qa,
    isNoHits,
};