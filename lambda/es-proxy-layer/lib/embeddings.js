const aws = require('aws-sdk');
const _ = require('lodash');
const { Configuration, OpenAIApi } = require("openai");

const get_embeddings_openai = async function get_embeddings_openai(params) {
    console.log("Fetch embeddings from openai for: ", params.embedding_input);
    const openai = new OpenAIApi(new Configuration({
        apiKey: params.settings.OPENAI_API_KEY,
        }));
    var openaires = await openai.createEmbedding({
    model: 'text-embedding-ada-002',
    input: params.embedding_input,
    });
    return openaires.data.data[0].embedding;
}

// input/output for endpoint running HF_MODEL intfloat/e5-large
// See https://huggingface.co/intfloat/e5-large
// Returns embedding with 1024 dimensions 
const get_embeddings_sm = async function get_embeddings_sm(params) {
    console.log("Fetch embeddings from sagemaker for: ", params.embedding_input);
    const sm = new aws.SageMakerRuntime({region: process.env.AWS_REGION || "us-east-1"});
    const body = JSON.stringify({"inputs":params.embedding_input});
    var smres = await sm.invokeEndpoint({
        EndpointName: params.settings.EMBEDDINGS_SAGEMAKER_ENDPOINT,
        ContentType: 'application/json',
        Body: body,
    }).promise();
    const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
    return sm_body[0][0];
}

const get_embeddings_lambda = async function get_embeddings_lambda(params) {
    console.log("Fetch embeddings from Lambda for: ", params.embedding_input);
    var lambda= new aws.Lambda();
    var lambdares=await lambda.invoke({
        FunctionName:params.settings.EMBEDDINGS_LAMBDA_ARN,
        InvocationType:'RequestResponse',
        Payload:JSON.stringify({inputText: params.embedding_input})
    }).promise();
    let payload=JSON.parse(lambdares.Payload);
    return payload.embedding;
}

module.exports = async function (params) {
    let settings = params.settings;
    let topic = params.topic;
    let question = params.question;
    params.embedding_input = (topic) ? `${question} (Topic is ${topic})` : question;
    if (settings.EMBEDDINGS_ENABLE) {
        if (settings.EMBEDDINGS_API === "OPENAI") {
            return get_embeddings_openai(params);
        } else if (settings.EMBEDDINGS_API === "SAGEMAKER") {
            return get_embeddings_sm(params);
        } else if (settings.EMBEDDINGS_API === "LAMBDA") {
            return get_embeddings_lambda(params);
        } else {
            console.log("Unrecognized value for EMBEDDINGS_API - expected SAGEMAKER|OPENAI|LAMBA: ", settings.EMBEDDINGS_API);
            return undefined;
        }
    } else {
        console.log("Embeddings disabled - EMBEDDINGS_ENABLE: ", settings.EMBEDDINGS_ENABLE);
        return undefined;
    }
};