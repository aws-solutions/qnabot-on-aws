const aws = require('aws-sdk');
const qnabot = require('qnabot/logging');

// remove URLS from Kendra passages
function clean_context(context) {
    let clean_context;
    clean_context = context.replace(/^ *Source Link:.*$/mg, '');
    return clean_context;
}

// input/output for endpoint running HF_MODEL philschmid/flan-t5-xxl-sharded-fp16
const get_qa_summary_sm = async function get_qa_summary_sm(question, context, settings) {
    const sm = new aws.SageMakerRuntime({region: process.env.AWS_REGION || 'us-east-1'});
    context = clean_context(context);
    qnabot.log(`Fetch QA Summary from SageMaker for question: '${question}' - Context: ${context}`);
    const model_params = JSON.parse(settings.QA_SUMMARY_SAGEMAKER_LLM_MODEL_PARAMS);
    const prompt_format = settings.QA_SUMMARY_SAGEMAKER_LLM_PROMPT_FORMAT || 
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
            EndpointName: process.env.QA_SUMMARIZE_SAGEMAKER_ENDPOINT,
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

async function get_qa_summary_cfaq(question, context, settings) {
    const sm = new aws.SageMakerRuntime({region:'us-east-1'});
    // context not currently used.. CFAQ does it's own Kendra query. Discussing with Lex team is CFAQ can optionally 
    // take context (list of passages) in place of Kendra query
    let data = JSON.parse(settings.QA_SUMMARY_SAGEMAKER_CFAQ_MODEL_PARAMS);
    data.query = question.trim()
    const body = JSON.stringify(data);
    let answer;
    qnabot.log('Invoking CFAQ Endpoint');
    try {
        let smres = await sm.invokeEndpoint({
            EndpointName:process.env.CFAQ_SAGEMAKER_ENDPOINT,
            ContentType:'text/csv',
            Body:body,
        }).promise();
        const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
        qnabot.log('CFAQ response body:', sm_body);
        answer = sm_body.text.trim();
        answer = answer.split("#### CFAQ-PASSAGE")[0]; // remove text coming after CFAQ PASSAGE
        answer = answer.replace(/CFAQ-ANSWER: /mg, "");
    } catch (e) {
        console.log(e)
        answer = 'CFAQ exception: ' + e.message.substring(0, 500) + '...';
    }
    qnabot.log(`CFAQ answer: '${answer}'`);
    return answer;
}

const get_qa_summary_lambda = async function get_qa_summary_lambda(question, context, settings) {
    qnabot.log(`Fetch QA Summary from Lambda for question: '${question}' - Context: ${context}`);
    let lambda= new aws.Lambda();
    let lambdares =await lambda.invoke({
        FunctionName:process.env.QA_SUMMARIZE_LAMBDA_ARN,
        InvocationType:'RequestResponse',
        Payload:JSON.stringify({question: question, context: context})
    }).promise();
    let payload=JSON.parse(lambdares.Payload);
    let answer = payload.generated_text;
    qnabot.log(`QA Summary Lambda function answer: '${answer}'`);
    return answer;
}

module.exports = {
    get_qa_summary_sm:get_qa_summary_sm,
    get_qa_summary_cfaq:get_qa_summary_cfaq,
    get_qa_summary_lambda:get_qa_summary_lambda,
}