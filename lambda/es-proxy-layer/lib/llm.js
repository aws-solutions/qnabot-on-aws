const _ = require('lodash');
const aws = require('aws-sdk');
const qnabot = require('qnabot/logging');

const ChatMessageHistory = require("langchain/memory").ChatMessageHistory;
const BufferMemory = require("langchain/memory").BufferMemory;
const PromptTemplate = require("langchain/prompts").PromptTemplate;
const ConversationChain = require("langchain/chains").ConversationChain;
const LLMChain = require("langchain/chains").LLMChain;
const ChatAnthropic = require("langchain/chat_models/anthropic").ChatAnthropic;
const ChatOpenAI = require("langchain/chat_models/openai").ChatOpenAI;

//
// Private functions
//

const default_params_stg = `{"temperature":0}`;

// Invoke LLM via LangChain 
function get_llm_model(api, params_stg, api_key) {
    params_stg = params_stg || default_params_stg;
    const params = JSON.parse(params_stg);
    let model;
    if (api === 'OPENAI') {
        process.env.OPENAI_API_KEY = api_key || process.env.OPENAI_API_KEY;
        model = new ChatOpenAI(params);
    }
    else if (api === 'ANTHROPIC') {
        process.env.ANTHROPIC_API_KEY = api_key || process.env.ANTHROPIC_API_KEY;
        model = new ChatAnthropic(params);
    } 
    else {
        throw new Error(`Unsupported LLM API: ${api}`);
    }
    return model;   
}
async function get_qa_langchain(req, promptTemplateStr, context) {
    let response;
    try {
        const chatMessageHistory = await chatMemoryParse(_.get(req._userInfo, "chatMessageHistory","[]"), req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
        const memory = new BufferMemory({ chatHistory: chatMessageHistory });
        const history = (await memory.loadMemoryVariables()).history;
        const input = get_question(req);
        const query = get_query(req);
        const promptTemplate = new PromptTemplate({
            template: promptTemplateStr,
            inputVariables: ["history", "context", "input", "query"],
        });
        // compute and log prompt value - for prompt troubleshooting only
        const prompt = await promptTemplate.format({
            history: history,
            context: context,
            input: input,
            query: query,
        });
        qnabot.log(`Prompt: \nPROMPT==>\n${prompt}\n<==PROMPT`);
        // end logging
        const model = get_llm_model(
            req._settings.LLM_API,
            req._settings.LLM_QA_MODEL_PARAMS,
            req._settings.LLM_THIRD_PARTY_API_KEY
        );
        const chain = new LLMChain({ llm: model, prompt: promptTemplate});
        const llm_res = await chain.call({ history: history, context: context, input: input, query: query });
        response = llm_res.text.trim();
    } catch (e) {
        qnabot.log("EXCEPTION:", e.stack);
        response = 'LangChain exception: ' + e.message.substring(0, 500) + '...';
    }
    return response;
}
async function generate_query_langchain(req, promptTemplateStr) {
    let response;
    try {
        const chatMessageHistory = await chatMemoryParse(_.get(req._userInfo, "chatMessageHistory","[]"), req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
        const memory = new BufferMemory({ chatHistory: chatMessageHistory });
        const promptTemplate = new PromptTemplate({
            template: promptTemplateStr,
            inputVariables: ["history", "input"],
        });
        // compute and log prompt value - for prompt troubleshooting only
        const prompt = await promptTemplate.format({
            history: (await memory.loadMemoryVariables()).history,
            input: req.question,
          });
        qnabot.log(`Prompt: \nPROMPT==>\n${prompt}\n<==PROMPT`);
        // end logging
        const model = get_llm_model(
            req._settings.LLM_API,
            req._settings.LLM_GENERATE_QUERY_MODEL_PARAMS,
            req._settings.LLM_THIRD_PARTY_API_KEY
        );
        const chain = new ConversationChain({ llm: model, memory: memory, prompt: promptTemplate });
        const llm_res = await chain.call({ input: req.question });
        console.log(llm_res);
        response = llm_res.response.trim();
    } catch (e) {
        qnabot.log("EXCEPTION:", e.stack);
        response = 'LangChain exception: ' + e.message.substring(0, 500) + '...';
    }
    return response;
}


// Invoke LLM via SageMaker endpoint running HF_MODEL philschmid/flan-t5-xxl-sharded-fp16
async function invoke_sagemaker(prompt, model_params) {
    const sm = new aws.SageMakerRuntime({region: process.env.AWS_REGION || 'us-east-1'});
    const body = JSON.stringify({
        'inputs': prompt,
        'parameters': model_params
    });
    let response;
    qnabot.log(`Prompt: \nPROMPT==>\n${prompt}\n<==PROMPT`);
    qnabot.log(`Invoking SageMaker endpoint: ${process.env.LLM_SAGEMAKERENDPOINT}`);
    try {
        let smres = await sm.invokeEndpoint({
            EndpointName: process.env.LLM_SAGEMAKERENDPOINT,
            ContentType: 'application/json',
            Body: body,
        }).promise();
        const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
        qnabot.log('SM response body:', sm_body);
        response = sm_body[0].generated_text;
    } catch (e) {
        qnabot.log("EXCEPTION:", e.stack);
        response = 'Sagemaker exception: ' + e.message.substring(0, 500) + '...';
    }
    return response;
}
async function generate_query_sagemaker(req, promptTemplateStr) {
    const model_params = JSON.parse(req._settings.LLM_GENERATE_QUERY_MODEL_PARAMS || default_params_stg);
    // parse and serialise chat history to manage max messages
    const chatMessageHistory = await chatMemoryParse(_.get(req._userInfo, "chatMessageHistory","[]"), req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    const history = await chatMemorySerialise(chatMessageHistory, req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    // format prompt and invoke model
    const prompt = promptTemplateStr.replace(/{history}/mg, history).replace(/{input}/mg, req.question);
    return invoke_sagemaker(prompt, model_params);
}
async function get_qa_sagemaker(req, promptTemplateStr, context) {
    const model_params = JSON.parse(req._settings.LLM_QA_MODEL_PARAMS || default_params_stg);
    const input = get_question(req);
    const query = get_query(req);
    // parse and serialise chat history to manage max messages
    const chatMessageHistory = await chatMemoryParse(_.get(req._userInfo, "chatMessageHistory","[]"), req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    const history = await chatMemorySerialise(chatMessageHistory, req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    const prompt = promptTemplateStr.replace(/{history}/mg, history).replace(/{context}/mg, context).replace(/{input}/mg, input).replace(/{query}/mg, query);
    return invoke_sagemaker(prompt, model_params);
}


// Invoke LLM via custom Lambda abstraction
async function invoke_lambda(prompt, model_params) {
    const lambda= new aws.Lambda({region: process.env.AWS_REGION || "us-east-1"});
    const body = JSON.stringify({
        'prompt': prompt,
        'parameters': model_params
    });
    let response;
    qnabot.log(`Prompt: \nPROMPT==>\n${prompt}\n<==PROMPT`);
    qnabot.log(`Invoking Lambda: ${process.env.LLM_LAMBDA_ARN}`);
    try {
        let lambdares =await lambda.invoke({
            FunctionName:process.env.LLM_LAMBDA_ARN,
            InvocationType:'RequestResponse',
            Payload: body,
        }).promise();
        let payload=JSON.parse(lambdares.Payload);
        qnabot.log('Lambda response payload:', payload);
        response = payload.generated_text;
    } catch (e) {
        qnabot.log("EXCEPTION:", e.stack);
        response = 'Lambda exception: ' + e.message.substring(0, 500) + '...';
    }
    return response;
}
async function generate_query_lambda(req, promptTemplateStr) {
    const model_params = JSON.parse(req._settings.LLM_GENERATE_QUERY_MODEL_PARAMS || default_params_stg);
    // parse and serialise chat history to manage max messages
    const chatMessageHistory = await chatMemoryParse(_.get(req._userInfo, "chatMessageHistory","[]"), req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    const history = await chatMemorySerialise(chatMessageHistory, req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    // format prompt and invoke model
    const prompt = promptTemplateStr.replace(/{history}/mg, history).replace(/{input}/mg, req.question);
    return invoke_lambda(prompt, model_params);
}
async function get_qa_lambda(req, promptTemplateStr, context) {
    const model_params = JSON.parse(req._settings.LLM_QA_MODEL_PARAMS || default_params_stg);
    // parse and serialise chat history to manage max messages
    const input = get_question(req);
    const query = get_query(req);
    const chatMessageHistory = await chatMemoryParse(_.get(req._userInfo, "chatMessageHistory","[]"), req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    const history = await chatMemorySerialise(chatMessageHistory, req._settings.LLM_CHAT_HISTORY_MAX_MESSAGES);
    const prompt = promptTemplateStr.replace(/{history}/mg, history).replace(/{context}/mg, context).replace(/{input}/mg, input).replace(/{query}/mg, query);
    return invoke_lambda(prompt, model_params);
}

// clean unwanted text artifacts from the provided context..
function clean_context(context, req) {
    let clean_context;
    // remove URLS from Kendra passages
    clean_context = context.replace(/^ *Source Link:.*$/mg, '');
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
  }


//
// Exported functions
//

// LangChain chatMessageHistory serialize (to JSON) and parse (from JSON)
// Chat history persistance is maintained via userInfo, managed from query.js, and stored in DynamoDB with other userInfo.
async function chatMemorySerialise(chatMessageHistory, max=50, human_prefix = "Human", ai_prefix = "AI") {
    const messages = await chatMessageHistory.getMessages();
    const obj_messages = [];
    for (const m of messages) {
        let role;
        if (m._getType() === "human") {
            role = human_prefix;
        }
        else if (m._getType() === "ai") {
            role = ai_prefix;
        }
        else {
            throw new Error(`Got unsupported message type: ${m}`);
        }
        obj_messages.push({[role]: m.text});
    }
    return JSON.stringify(obj_messages.slice(-max));
  }
async function chatMemoryParse(json_messages, max=50) {
    const chatMessageHistory = new ChatMessageHistory();
    const obj_messages = JSON.parse(json_messages).slice(-max);
    qnabot.log(`Chat Message History (capped at ${max}): `, json_messages);
    for (const m of obj_messages) {
        if (m.Human) {
            chatMessageHistory.addUserMessage(m.Human);
        } 
        else if (m.AI) {
            chatMessageHistory.addAIChatMessage(m.AI);
        } 
        else {
            throw new Error(`Got unsupported message type: ${m}`);
        }
    }
    return chatMessageHistory;
  }

  // return the question to use in the QA prompt
function get_question(req) {
    const question = _.get(req,"llm_generated_query.orig", req.question);
    return question;
}
function get_query(req) {
    const query = _.get(req,"llm_generated_query.result", req.question);
    return query;
}

// generate_query: re-write utterance using chat history if needed, to make it standalone from prior conversation context.
const generate_query = async function generate_query(req) {
    qnabot.log(`Use LLM (${req._settings.LLM_API}) to convert a follow up question to a standalone search query containing required context from chat history`);
    const origQuestion = req.question;
    // TODO - Can this also tell me if a query is needed, or if the LLM/chatHistory already has the answer
    let promptTemplateStr = req._settings.LLM_GENERATE_QUERY_PROMPT_TEMPLATE || `<br><br>Human: Given the following conversation and a follow up input, if the follow up input is a question please rephrase that question to be a standalone question, otherwise return the input unchanged.<br><br>Chat History:<br?{history}<br><br>Follow Up Input: {input}<br><br>Assistant:`;
    promptTemplateStr = promptTemplateStr.replace(/<br>/mg, "\n");
    let newQuery;
    if (req._settings.LLM_API == "SAGEMAKER") {
        // TODO refactor when langchainJS supports Sagemaker
        newQuery = await generate_query_sagemaker(req, promptTemplateStr);
    } else if (req._settings.LLM_API == "LAMBDA") {
        newQuery = await generate_query_lambda(req, promptTemplateStr);
    } else { // LangChain for all other LLM options
        newQuery = await generate_query_langchain(req, promptTemplateStr);
    }
    qnabot.log(`Original question: ${origQuestion} => New question: ${newQuery}`);
    req.question = newQuery;
    req.llm_generated_query = {
        orig: origQuestion,
        result: newQuery
    };
    return req;
}

const get_qa = async function get_qa(req, context) {
    qnabot.log(`LLM (${req._settings.LLM_API}) Retrieval Augmented Generation (RAG) to answer user's question from search result context.`);
    let promptTemplateStr = req._settings.LLM_QA_PROMPT_TEMPLATE || `<br><br>Human: You are an AI chatbot. Carefully read the following context and conversation history and then provide a short answer to question at the end. If the answer cannot be determined from the history or the context, reply saying "Sorry, I don't know". <br><br>Context: {context}<br><br>History: <br>{history}<br><br>Human: {input}<br><br>Assistant:`;
    promptTemplateStr = promptTemplateStr.replace(/<br>/mg, "\n");
    context = clean_context(context, req);
    let answer;
    if (req._settings.LLM_API == "SAGEMAKER") {
        // TODO refactor when langchainJS supports Sagemaker
        answer = await get_qa_sagemaker(req, promptTemplateStr, context);
    } else if (req._settings.LLM_API == "LAMBDA") {
        answer = await get_qa_lambda(req, promptTemplateStr, context);
    } else { // LangChain for all other LLM options
        answer = await get_qa_langchain(req, promptTemplateStr, context);
    }
    qnabot.log(`Question: ${req.question}`);
    qnabot.log(`Context: ${context}`);
    qnabot.log(`Answer: ${answer}`);
    return answer; 
}

module.exports = {
    chatMemorySerialise:chatMemorySerialise,
    chatMemoryParse:chatMemoryParse,
    get_question:get_question,
    generate_query:generate_query,
    get_qa:get_qa
}