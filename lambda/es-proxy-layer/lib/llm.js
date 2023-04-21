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

// LangChain chat memory helpers
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
async function chatMemoryParse(json_messages) {
    const chatMessageHistory = new ChatMessageHistory();
    const obj_messages = JSON.parse(json_messages);
    qnabot.log("Chat Message History: ", json_messages);
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


// clean unwanted text artifacts from the provided context..
function clean_context(context) {
    let clean_context;
    // remove URLS from Kendra passages
    clean_context = context.replace(/^ *Source Link:.*$/mg, '');
    return clean_context;
}

function get_llm_model(api, params_stg, api_key) {
    params_stg = params_stg || `{"temperature":0}`;
    const params = JSON.parse(params_stg);
    let model;
    if (api === 'OPENAI') {
        process.env.OPENAI_API_KEY = api_key ;
        model = new ChatOpenAI(params);
    }
    else if (api === 'ANTHROPIC') {
        process.env.ANTHROPIC_API_KEY = api_key ;
        model = new ChatAnthropic(params);
    } 
    else {
        throw new Error(`Unsupported LLM API: ${api}`);
    }
    return model;   
}

// re-write utterance if needed, to make it standalone from prior context.
const disambiguate_question = async function disambiguate_question(req) {
    qnabot.log(`Use LLM (${req._settings.LLM_API}) to convert a follow up question to a standalone question containing required context from chat history`);

    const origQuestion = req.question;
    const chatMemoryHistory = await chatMemoryParse(_.get(req._userInfo, "chatMemoryHistory","[]"));
    const memory = new BufferMemory({ chatHistory: chatMemoryHistory });
    // TODO - Can this also tell me if a query is needed, or if the LLM/chatHistory already has the answer
    const promptTemplateStr = req._settings.LLM_DISABIGUATE_PROMPT_TEMPLATE || `Given the following conversation and a follow up input, if the follow up input is a question please rephrase that question to be a standalone question, otherwise return the input unchanged.\n\nChat History:\n{history}\n\nFollow Up Input: {input}\nStandalone question:`;
    const prompt = new PromptTemplate({
        template: promptTemplateStr,
        inputVariables: ["history", "input"],
    });

    const model = get_llm_model(
        req._settings.LLM_API,
        req._settings.LLM_DISABIGUATE_MODEL_PARAMS,
        req._settings.LLM_THIRD_PARTY_API_KEY
    );

    const chain = new ConversationChain({ llm: model, memory: memory, prompt: prompt, verbose: true });

    const llm_res = await chain.call({ input: origQuestion });
    const newQuestion = llm_res.response.trim();

    qnabot.log(`Original question: ${origQuestion} => New question: ${newQuestion}`);
    req.question = newQuestion;
    req.llm_disambiguate = {
        orig: origQuestion,
        result: newQuestion
    };
    return req;
}

const get_qa = async function get_qa(req, context) {
    qnabot.log(`LLM (${req._settings.LLM_API}) Retrieval Augmented Generation (RAG) to answer user's question from search result context.`);
    const chatMemoryHistory = await chatMemoryParse(_.get(req._userInfo, "chatMemoryHistory","[]"));
    const promptTemplateStr = req._settings.LLM_QA_PROMPT_TEMPLATE || `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.\n\n{context}\n\nQuestion: {question}\nHelpful Answer:`;
    const prompt = new PromptTemplate({
        template: promptTemplateStr,
        inputVariables: ["context", "question"],
    });
    const model = get_llm_model(
        req._settings.LLM_API,
        req._settings.LLM_DISABIGUATE_MODEL_PARAMS,
        req._settings.LLM_THIRD_PARTY_API_KEY
    );
    const chain = new LLMChain({ llm: model, prompt: prompt});
    const llm_res = await chain.call({ context: context, question: req.question });
    const answer = llm_res.text.trim();
    qnabot.log(`Question: ${req.question}`);
    qnabot.log(`Context: ${context}`);
    qnabot.log(`Answer: ${answer}`);
    return answer; 
}

/* 

// input/output for endpoint running HF_MODEL philschmid/flan-t5-xxl-sharded-fp16
const get_qa_summary_sm = async function get_qa_summary_sm(question, context, settings) {
    const sm = new aws.SageMakerRuntime({region: process.env.AWS_REGION || 'us-east-1'});
    context = clean_context(context);
    qnabot.log(`Fetch QA Summary from SageMaker for question: '${question}' - Context: ${context}`);
    const model_params = JSON.parse(settings.LLM_SAGEMAKER_MODEL_PARAMS);
    const prompt_format = settings.LLM_SAGEMAKER_PROMPT_FORMAT || 
        'Answer the last question based on the following text, or answer I dont know.\n<CONTEXT>\n<QUESTION>\nAnswer:';
    const prompt = prompt_format.replace(/<CONTEXT>/mg, context).replace(/<QUESTION>/mg, question).replace(/<br>/mg, "\n");
    qnabot.log(`Prompt: \n${prompt}`);
    const body = JSON.stringify({
        'inputs': prompt,
        'parameters': model_params
    });
    let answer;
    try {
        let smres = await sm.invokeEndpoint({
            EndpointName: process.env.LLM_SAGEMAKERENDPOINT,
            ContentType: 'application/json',
            Body: body,
        }).promise();
        const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
        qnabot.log('SM response body:', sm_body);
        answer = sm_body[0].generated_text;
    } catch (e) {
        qnabot.log(e)
        answer = 'QA Summary Sagemaker exception: ' + e.message.substring(0, 500) + '...';
    }
    qnabot.log(`QA Summary answer: '${answer}'`);
    return answer;
}

const get_qa_summary_lambda = async function get_qa_summary_lambda(question, context, settings) {
    qnabot.log(`Fetch QA Summary from Lambda for question: '${question}' - Context: ${context}`);
    let lambda= new aws.Lambda();
    let lambdares =await lambda.invoke({
        FunctionName:process.env.LLM_LAMBDA_ARN,
        InvocationType:'RequestResponse',
        Payload:JSON.stringify({question: question, context: context, settings: settings})
    }).promise();
    let payload=JSON.parse(lambdares.Payload);
    let answer = payload.generated_text;
    qnabot.log(`QA Summary Lambda function answer: '${answer}'`);
    return answer;
}

*/

module.exports = {
    chatMemorySerialise:chatMemorySerialise,
    chatMemoryParse:chatMemoryParse,
    disambiguate_question:disambiguate_question,
    get_qa:get_qa
}