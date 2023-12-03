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

/*
function to delete existing {qids} from a opensearch index
the information to delete existing {qids} should be made available in a "/options/{filename} file in the QnABot {import} S3 bucket
*/
const aws = require('aws-sdk');

const objS3 = new aws.S3();
const objLambda = new aws.Lambda();

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
        console.log(params);
        await objS3.waitFor('objectExists', params).promise(); // check if the options file exists for the Import request. This is currently only available when the Import process is initiated via the QnABot CLI
    } catch (e) {
        console.log(`No import options file (${params.Key}) - expected only if import process is initiated via the QnABot CLI.`);
        return ES_formatted_content;
    }
    let data = await objS3.getObject(params).promise(); // get the options file
    let objBody = JSON.parse(data.Body.toString()); // get the Body content of the options file
    let objectDatetime = new Date(data.LastModified); // get the datetime of the object
    let import_datetime = new Date(objBody.import_datetime); // get the datetime when the import was initiated

    while (objectDatetime < import_datetime) { // loop until the object in S3 is the latest file that needs to be used
        if (objectDatetime < import_datetime) { // get the object again and check if the file in S3 is the latest that needs to be used
            data = await objS3.getObject(params).promise(); // get the options file
            objBody = JSON.parse(data.Body.toString()); // get the Body content of the options file
        	objectDatetime = new Date(data.LastModified); // get the datetime of the object
        	import_datetime = new Date(objBody.import_datetime); // get the datetime when the import was initiated
        }
    }
    if (objBody.options.delete_existing_content) { // proceed if the value is True
        console.log(objBody);
        console.log(`delete_existing_content: ${objBody.options.delete_existing_content}`);
        console.log('deleting existing content');
        const response = await objLambda.invoke({ // invoke lambda function to run query against a opensearch cluster index
            FunctionName: process.env.ES_PROXY,
            Payload: JSON.stringify(ESdeletebody),
        }).promise();
        config.EsErrors.push(JSON.parse(_.get(response, 'Payload', '{}')).errors);
        console.log(response);
        console.log('deleted existing content');
    }
    return ES_formatted_content;
}

exports.delete_existing_content = async function (esindex, config, ES_formatted_content) {
    return await delete_existing_content(esindex, config, ES_formatted_content);
};
