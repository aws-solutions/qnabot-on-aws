/*********************************************************************************************************************
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
 *********************************************************************************************************************/

const { Lambda } = require('@aws-sdk/client-lambda');
const { SageMakerRuntime } = require('@aws-sdk/client-sagemaker-runtime');
const _ = require('lodash');
const region = process.env.AWS_REGION || 'us-east-1';
const customSdkConfig = require('../lib/util/customSdkConfig');

// input/output for endpoint running HF_MODEL intfloat/e5-large
// See https://huggingface.co/intfloat/e5-large
// Returns embedding with 1024 dimensions
const get_embeddings_sm = async function get_embeddings_sm(type_q_or_a, input, settings) {
    const sm = new SageMakerRuntime(customSdkConfig('C003', { region }));
    // prefix input text with 'query:' or 'passage:' to generate suitable embeddings per https://huggingface.co/intfloat/e5-large
    if (_.get(settings, 'EMBEDDINGS_QUERY_PASSAGE_PREFIX_STRINGS', true)) {
        if (type_q_or_a === 'a') {
            input = `passage: ${input}`;
        } else {
            input = `query: ${input}`;
        }
    }
    console.log(`Fetch embeddings from SageMaker for type: '${type_q_or_a}' - InputText: ${input}`);
    const body = JSON.stringify({ inputs: input });
    const smres = await sm.invokeEndpoint({
        EndpointName: process.env.EMBEDDINGS_SAGEMAKER_ENDPOINT,
        ContentType: 'application/json',
        Body: body,
    });
    const sm_body = JSON.parse(Buffer.from(smres.Body, 'utf-8').toString());
    return sm_body.vectors;
};

const get_embeddings_lambda = async function get_embeddings_lambda(type_q_or_a, input, settings) {
    console.log(`Fetch embeddings from Lambda for type: '${type_q_or_a}' - InputText: ${input}`);
    const lambda = new Lambda(customSdkConfig('C004', { region }));
    const lambdares = await lambda.invoke({
        FunctionName: process.env.EMBEDDINGS_LAMBDA_ARN,
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ inputType: type_q_or_a, inputText: input }),
    });
    const payloadObj = Buffer.from(lambdares.Payload).toString();
    const payload = JSON.parse(payloadObj);
    return payload.embedding;
};

module.exports = async function (type_q_or_a, input, settings) {
    if (settings.EMBEDDINGS_ENABLE) {
        if (process.env.EMBEDDINGS_API === 'SAGEMAKER') {
            return get_embeddings_sm(type_q_or_a, input, settings);
        } 
        if (process.env.EMBEDDINGS_API === 'LAMBDA') {
            return get_embeddings_lambda(type_q_or_a, input, settings);
        }
        console.log('Unrecognized value for env var EMBEDDINGS_API - expected SAGEMAKER|LAMBA: ', process.env.EMBEDDINGS_API);
        return undefined;
    }
    console.log('Embeddings disabled - EMBEDDINGS_ENABLE: ', settings.EMBEDDINGS_ENABLE);
    return undefined;
};
