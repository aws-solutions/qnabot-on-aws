const aws = require('aws-sdk');
const _ = require('lodash');

// input/output for endpoint running HF_MODEL intfloat/e5-large
// See https://huggingface.co/intfloat/e5-large
// Returns embedding with 1024 dimensions
const get_embeddings_sm = async function get_embeddings_sm(type_q_or_a, input, settings) {
    const sm = new aws.SageMakerRuntime({region: process.env.AWS_REGION || "us-east-1"});
    // prefix input text with 'query:' or 'passage:' to generate suitable embeddings per https://huggingface.co/intfloat/e5-large
    if (_.get(settings,'EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS',true)) {
        if (type_q_or_a === "a") {
            input = `passage: ${input}`;
        } else {
            input = `query: ${input}`;
        }
    }
    console.log(`Fetch embeddings from SageMaker for type: '${type_q_or_a}' - InputText: ${input}`);
    const body = JSON.stringify({"inputs":input});
    let smres = await sm.invokeEndpoint({
        EndpointName: process.env.EMBEDDINGS_SAGEMAKER_ENDPOINT,
        ContentType: 'application/json',
        Body: body,
    }).promise();
    const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
    return sm_body.vectors;
}

const get_embeddings_lambda = async function get_embeddings_lambda(type_q_or_a, input, settings, function_name) {
    console.log(`Fetch embeddings from Lambda for type: '${type_q_or_a}' - InputText: ${input}`);
    let embedding;
    let lambda= new aws.Lambda();
    let lambdares=await lambda.invoke({
        FunctionName:function_name,
        InvocationType:'RequestResponse',
        Payload:JSON.stringify({inputType: type_q_or_a, inputText: input})
    }).promise();
    let payload=JSON.parse(lambdares.Payload);
    if (payload.embedding) {
        embedding = payload.embedding;
    } else {
        qnabot.log('ERROR: Embedding Lambda response error:', payload);
        embedding = undefined;
    }
    return embedding;
}

module.exports = async function (type_q_or_a, input, settings) {
    if (settings.EMBEDDINGS_ENABLE) {
        if (process.env.EMBEDDINGS_API === "SAGEMAKER") {
            return get_embeddings_sm(type_q_or_a, input, settings);
        } else if (process.env.EMBEDDINGS_API === "LAMBDA") {
            return get_embeddings_lambda(type_q_or_a, input, settings, process.env.EMBEDDINGS_LAMBDA_ARN);
        } else if (process.env.EMBEDDINGS_API === "BEDROCK") {
            return get_embeddings_lambda(type_q_or_a, input, settings, process.env.BEDROCK_EMBEDDINGS_LAMBDA_ARN);
        }else {
            console.log("Unrecognized value for env var EMBEDDINGS_API - expected SAGEMAKER|LAMBA|BEDROCK: ", process.env.EMBEDDINGS_API);
            return undefined;
        }
    } else {
        console.log("Embeddings disabled - EMBEDDINGS_ENABLE: ", settings.EMBEDDINGS_ENABLE);
        return undefined;
    }
};
