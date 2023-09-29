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

// createFAQ.js
const sleep = require('util').promisify(setTimeout);
const AWSKendra = require('aws-sdk/clients/kendra');
const AWSS3 = require('aws-sdk/clients/s3');
const qnabot = require('qnabot/logging');

/**
 * Function to upload JSON to S3 bucket, return Promise
 * @param s3Client
 * @param params
 * @returns {*}
 */
function s3Uploader(s3Client, params) {
    return new Promise((resolve, reject) => {
        s3Client.putObject(params, (err, data) => {
            if (err) {
                qnabot.log(err, err.stack); // an error occurred
                reject(err);
            } else {
                qnabot.log('Uploaded JSON to S3 successfully:');
                qnabot.log(data); // successful response
                resolve(data);
            }
        });
    });
}

/**
 * Function to convert uploaded JSON into Kendra FAQ, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
function faqConverter(kendraClient, params) {
    return new Promise((resolve, reject) => {
        kendraClient.createFaq(params, (err, data) => {
            if (err) {
                qnabot.log(err, err.stack); // an error occurred
                reject(err);
            } else {
                qnabot.log('Converted JSON to FAQ successfully:');
                qnabot.log(data); // successful response
                poll(() => kendraClient.describeFaq({ IndexId: params.IndexId, Id: data.Id }).promise(), (result) => {
                    qnabot.log(`describeFaq ${JSON.stringify(result)}`);
                    const status = result.Status == 'PENDING_CREATION' || result.Status == 'CREATING';
                    return {
                        Status: status ? 'PENDING' : result.Status,
                        Message: result.Status == 'FAILED' ? result.ErrorMessage : null,
                    };
                }, 5000)
                    .then(() => resolve(data))
                    .catch(() => reject('Could not sync Kendra FAQ')); // successful response
            }
        });
    });
}

/**
 * Function to delete old FAQ from Kendra index, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
function faqDeleter(kendraClient, params) {
    return new Promise((resolve, reject) => {
        kendraClient.deleteFaq(params, (err, data) => {
            if (err) {
                qnabot.log(err, err.stack); // an error occurred
                reject(err);
            } else {
                qnabot.log(`Deleted old FAQ successfully. New list of FAQs in index ${params.IndexId}:`);
                qnabot.log(`Delete parameters ${JSON.stringify(params)}`);
                // describeFaq should cause an exception when the faq has been deleted.
                poll(() => kendraClient.describeFaq(params).promise(), (result) => ({ Status: 'PENDING' }), 5000).then(() => resolve(data)); // successful response
            }
        });
    });
}

function wait(ms = 1000) {
    return new Promise((resolve) => {
        qnabot.log(`waiting ${ms} ms...`);
        setTimeout(resolve, ms);
    });
}

async function poll(fn, fnCondition, ms) {
    let result = await fn();

    while (fnCondition(result).Status == 'PENDING') {
        await wait(ms);

        try {
            result = await fn();
        } catch (e) {
            if (e.Propragate) {
                throw (e.Message);
            }

            return e;
        }
    }
    if (result.Status == 'FAILED') {
        throw new Error('Error during Kendra Sync');
    }
    return result;
}

/**
 * Function to list existing FAQs in a Kendra index, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
function faqLister(kendraClient, params) {
    return new Promise((resolve, reject) => {
        kendraClient.listFaqs(params, (err, data) => {
            if (err) {
                qnabot.log(err, err.stack); // an error occurred
                reject(err);
            } else {
                qnabot.log(`Checked for pre-existing FAQ successfully. List of FAQs for index ${params.IndexId}:`);
                qnabot.log(data); // successful response
                resolve(data);
            }
        });
    });
}

async function execFuncHandleThrottleException(func, client, params) {
    for (let attempts = 0; attempts < 10; attempts += 1) {
        try {
            return await func(client, params);
        } catch (error) {
            if (error.code == 'ThrottlingException') {
                qnabot.log(`Throttling exception: trying ${func.name} again in 10 seconds`);
                await sleep(10000);
                continue;
            } else {
                throw error;
            }
        }
    }
    throw new Error(`Retry limits exceeded for ${func.name}. See logs for additional information.`);
}

/**
 * Function to upload JSON into S3 bucket and convert into Kendra FAQ, return Promise
 * @returns {*}
 */
async function createFAQ(params) {
    // create kendra and s3 clients
    const region = process.env.REGION || params.region;
    const kendraClient = new AWSKendra({ apiVersion: '2019-02-03', region });
    const s3Client = new AWSS3({ apiVersion: '2006-03-01', region });
    qnabot.log('clients created');

    // read in JSON and upload to S3 bucket
    const fs = require('fs');
    const s3_params = {
        Bucket: params.s3_bucket,
        Key: params.s3_key,
        ACL: 'bucket-owner-read', // NOSONAR TODO: should this param be public?
        Body: fs.createReadStream(params.json_path), // use read stream option in case file is large
    };

    await execFuncHandleThrottleException(s3Uploader, s3Client, s3_params);
    await sleep(10000);

    // if FAQ exists already, delete the old one and update it
    const index_params = {
        IndexId: params.faq_index_id,
        MaxResults: '30', // default max number of FAQs in developer edition
    };

    const list_faq_response = await execFuncHandleThrottleException(faqLister, kendraClient, index_params);
    await sleep(10000);

    let elem;
    let index = null;
    for (let j = 0; j < list_faq_response.FaqSummaryItems.length; j += 1) {
        elem = list_faq_response.FaqSummaryItems[j];
        if (elem.Name == params.faq_name) {
            index = elem.Id;
            break;
        }
    }
    if (index != null) {
        const delete_faq_params = {
            Id: index,
            IndexId: params.faq_index_id,
        };
        await execFuncHandleThrottleException(faqDeleter, kendraClient, delete_faq_params);
    } else {
        qnabot.log('No old FAQ to delete');
    }
    await sleep(10000);

    // create the FAQ
    const faq_params = {
        IndexId: params.faq_index_id,
        Name: params.faq_name,
        RoleArn: params.kendra_s3_access_role,
        FileFormat: 'JSON',
        S3Path: {
            Bucket: params.s3_bucket,
            Key: params.s3_key,
        },
        Description: 'Exported FAQ of questions from QnABot designer console',
        // if no tags, delete parameter because empty arrays cause throttling exceptions
    };

    const faq_response = await execFuncHandleThrottleException(faqConverter, kendraClient, faq_params);
    await sleep(10000);
    return faq_response;
}

exports.handler = async (params) => await createFAQ(params);
