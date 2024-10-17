/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/*
function to delete existing {qids} from a opensearch index
the information to delete existing {qids} should be made available in a "/options/{filename} file in the QnABot {import} S3 bucket
*/
const region = process.env.AWS_REGION;
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { S3Client, waitUntilObjectExists, GetObjectCommand } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const qnabot = require('qnabot/logging');
const objS3 = new S3Client(customSdkConfig('C010', { region }));
const objLambda = new LambdaClient(customSdkConfig('C010', { region }));

const _ = require('lodash');

async function delete_existing_content(esindex, config, ES_formatted_content) {
    const ESdelete_query = '{"query":{"match_all":{}}}'; // opensearch query to delete all records in a index
    const ESdeletebody = {
        endpoint: process.env.ES_ENDPOINT,
        method: 'POST',
        path: `${esindex}/_delete_by_query?conflicts=proceed&refresh=true`,
        body: ESdelete_query,
    };

    const key = config.key.split('/')[1]; // get the filename and not the whole path
    const params = {
        Bucket: config.bucket,
        Key: `options/${key}`,
    };
    try {
        qnabot.log('S3 params', params);
        await waitUntilObjectExists({
            client: objS3,
            maxWaitTime: 10
        }, params); // check if the options file exists for the Import request. This is currently only available when the Import process is initiated via the QnABot CLI
    } catch (e) {
        qnabot.log(`No import options file (${params.Key}) - expected only if import process is initiated via the QnABot CLI.`);
        return ES_formatted_content;
    };
    let data = await objS3.send(new GetObjectCommand(params)); // get the options file
    let objBody = JSON.parse(await data.Body.transformToString()); // get the Body content of the options file
    let objectDatetime = new Date(data.LastModified); // get the datetime of the object
    let import_datetime = new Date(objBody.import_datetime); // get the datetime when the import was initiated

    while (objectDatetime < import_datetime) { // loop until the object in S3 is the latest file that needs to be used
        data = await objS3.send(new GetObjectCommand(params)); // get the options file
        objBody = JSON.parse(await data.Body.transformToString()); // get the Body content of the options file
        objectDatetime = new Date(data.LastModified); // get the datetime of the object
        import_datetime = new Date(objBody.import_datetime); // get the datetime when the import was initiated
    };
    if (objBody?.options?.delete_existing_content) { // proceed if the value is True
        qnabot.log(`delete_existing_content: ${objBody.options.delete_existing_content}`);
        qnabot.log('deleting existing content');
        const response = await objLambda.send(new InvokeCommand(
            { // invoke lambda function to run query against a opensearch cluster index
                FunctionName: process.env.ES_PROXY,
                Payload: JSON.stringify(ESdeletebody),
            }
        ));
        config.EsErrors.push(JSON.parse(_.get(response, 'Payload', '{}')).errors);
        qnabot.log('lambda response', response);
        qnabot.log('deleted existing content');
    }
    return ES_formatted_content;
};

exports.delete_existing_content = async function (esindex, config, ES_formatted_content) {
    return await delete_existing_content(esindex, config, ES_formatted_content);
};
