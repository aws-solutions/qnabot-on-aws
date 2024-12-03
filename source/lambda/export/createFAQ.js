/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// createFAQ.js
const sleep = require('util').promisify(setTimeout);
const { KendraClient, CreateFaqCommand, DescribeFaqCommand, DeleteFaqCommand, ListFaqsCommand } = require('@aws-sdk/client-kendra');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const qnabot = require('qnabot/logging');
const customSdkConfig = require('sdk-config/customSdkConfig');

/**
 * Function to upload JSON to S3 bucket, return Promise
 * @param s3Client
 * @param params
 * @returns {*}
 */
async function s3Uploader(s3Client, params) {
    try {
        const data = await s3Client.send(new PutObjectCommand(params));
        qnabot.log('Uploaded JSON to S3 successfully:', data);
        return data;
    } catch (error) {
        qnabot.log(error, error.stack);
        throw error;
    }
}

/**
 * Function to convert uploaded JSON into Kendra FAQ, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
async function faqConverter(kendraClient, params) {
    try {
        const data = await kendraClient.send(new CreateFaqCommand(params));
        qnabot.log('Converted JSON to FAQ successfully:', data);
        try {
            await poll(async () => await kendraClient.send(new DescribeFaqCommand({ IndexId: params.IndexId, Id: data.Id })), (result) => {
                qnabot.log(`describeFaq ${JSON.stringify(result)}`);
                const status = result.Status == 'PENDING_CREATION' || result.Status == 'CREATING';
                return {
                    Status: status ? 'PENDING' : result.Status,
                    Message: result.Status == 'FAILED' ? result.ErrorMessage : null,
                };
            }, 5000);
            return data;
        } catch (err) {
            qnabot.log(err, err.stack);
            throw new Error('Could not sync Kendra FAQ');
        }
      } catch (error) {
        qnabot.log(error, error.stack);
        throw error;
      }
}

/**
 * Function to delete old FAQ from Kendra index, return Promise
 * @param kendraClient
 * @param params
 * @returns {*}
 */
async function faqDeleter(kendraClient, params) {
    try {
        const data = await kendraClient.send(new DeleteFaqCommand(params));
        qnabot.log(`Deleted old FAQ successfully. New list of FAQs in index ${params.IndexId}:`);
        qnabot.log(`Delete parameters ${JSON.stringify(params)}`);
        // describeFaq should cause an exception when the faq has been deleted.
        await poll(async () => await kendraClient.send(new DescribeFaqCommand(params)), (result) => {
            const status = result.Status == 'PENDING_DELETION' || result.Status == 'DELETING';
            return {
                Status: status ? 'PENDING' : result.Status,
                Message: result.Status == 'FAILED' ? result.ErrorMessage : null,
            };
         }, 5000); // successful response
        return data;
    } catch (error) {
        qnabot.log(error, error.stack);
        throw error;
    }
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
async function faqLister(kendraClient, params) {
    try {
        const data = await kendraClient.send(new ListFaqsCommand(params));
        qnabot.log(`Checked for pre-existing FAQ successfully. List of FAQs for index ${params.IndexId}:`, data);// successful response
        return data;
    } catch (error) {
        qnabot.log(error, error.stack);
        throw error;
    };
}

async function execFuncHandleThrottleException(func, client, params) {
    for (let attempts = 0; attempts < 10; attempts += 1) {
        try {
            return await func(client, params);
        } catch (error) {
            if (error.name == 'ThrottlingException') {
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
    const kendraClient = new KendraClient(customSdkConfig('C007', { apiVersion: '2019-02-03', region }));
    const s3Client = new S3Client(customSdkConfig('C007', { apiVersion: '2006-03-01', region }));
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
        MaxResults: 30, // default max number of FAQs in developer edition
    };

    const list_faq_response = await execFuncHandleThrottleException(faqLister, kendraClient, index_params);
    await sleep(10000);

    let elem;
    let index = null;
    for (let j = 0; j < list_faq_response.FaqSummaryItems.length; j += 1) {  // NOSONAR Helps with Readability
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
