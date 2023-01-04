const aws = require('aws-sdk');
const qnabot = require("qnabot/logging")
const _ = require('lodash');
const { Configuration, OpenAIApi } = require("openai");


const get_embeddings_openai = async function get_embeddings(params) {
    let topic = params.topic;
    let question = params.question;
    var question_with_topic = (topic) ? `${question} (Topic is ${topic})` : question;
    console.log("Fetch embeddings from openai for: ", question_with_topic);
    const openai = new OpenAIApi(new Configuration({
        apiKey: params.openai_api_key,
        }));
    var openaires = await openai.createEmbedding({
    model: params.embeddings_openai_model,
    input: question_with_topic,
    });
    return openaires.data.data[0].embedding;
}

const get_embeddings_sm = async function get_embeddings(params) {
    let topic = params.topic;
    let question = params.question;
    var question_with_topic = (topic) ? `${question} (Topic is ${topic})` : question;
    console.log("Fetch embeddings from sagemaker for: ", question_with_topic);
    const sm = new aws.SageMakerRuntime({region:'us-east-1'});
    const body = Buffer.from(JSON.stringify(question_with_topic), 'utf-8').toString();
    var smres = await sm.invokeEndpoint({
        EndpointName: params.embeddings_sagemaker_endpoint,
        ContentType: 'application/x-text',
        Body: body,
    }).promise();
    const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
    return sm_body.embedding;
}

module.exports = async function (params) {
    if (params.embeddings_enable) {
        if (params.openai_api_key) {
            return get_embeddings_openai(params);
        } else {
            return get_embeddings_sm(params);
        }
    } else {
        console.log("EMBEDDINGS_ENABLE (disabled): ", params.embeddings_enable);
        return undefined;
    }
  };