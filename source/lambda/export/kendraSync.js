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

const { S3Client, GetObjectCommand, PutObjectCommand, waitUntilObjectExists } = require('@aws-sdk/client-s3');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.REGION;
const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');

const s3 = new S3Client(customSdkConfig('C007', { apiVersion: '2006-03-01', region }));
const _ = require('lodash');
const parse = require('./parseJSON');
const create = require('./createFAQ');

/**
 * Function to retrieve QnABot settings
 * @returns {*}
 */
async function get_settings() {
    const settings = await qna_settings.getSettings();
    // NOSONAR TODO: investigate why this value is being 'set' to undefined instead of
    // being 'unset' or ignored all together
    _.set(settings, 'DEFAULT_USER_POOL_JWKS_URL');

    qnabot.debug('Merged Settings: ', settings);
    return settings;
}

/**
 * Function to perform Kendra Sync of exported QnABot content into FAQ
 * @param event
 * @param context
 * @param cb
 * @returns 'Synced' if successful
 */
exports.performSync = async function (event, context, cb) {
    try {
        qnabot.log('Request', JSON.stringify(event, null, 2));
        const Bucket = event.Records[0].s3.bucket.name;
        const Key = decodeURI(event.Records[0].s3.object.key);
        const VersionId = _.get(event, 'Records[0].s3.object.versionId');
        qnabot.log(Bucket, Key);

        // triggered by export file, waits to be uploaded
        await waitUntilObjectExists(
            {
                client: s3,
                maxWaitTime: 30
            },
            { Bucket, Key, VersionId }
        );
        const getObjCmd = new GetObjectCommand({ Bucket, Key, VersionId });
        const x = await s3.send(getObjCmd);
        const content = await x.Body.transformToString();

        // parse JSON into Kendra format
        const parseJSONparams = {
            json_name: 'qna_FAQ.json',
            content,
            output_path: '/tmp/qna_FAQ.json'  // NOSONAR - javascript:S5443 - directories are used safely here
        };
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Parsing content JSON');
        await parse.handler(parseJSONparams);
        qnabot.log('Parsed content JSON into Kendra FAQ file format stored locally');

        // get QnABot settings to retrieve KendraFAQIndex
        const settings = await get_settings();
        qna_settings.set_environment_variables(settings);

        const kendra_faq_index = _.get(settings, 'KENDRA_FAQ_INDEX', '');
        if (kendra_faq_index == '') {
            throw new Error(`No FAQ Index set: ${kendra_faq_index}`);
        }
        qnabot.log(`kendra faq index is ${kendra_faq_index}`);

        // create kendra FAQ from JSON
        const createFAQparams = {
            faq_name: 'qna-facts',
            faq_index_id: kendra_faq_index,
            json_path: parseJSONparams.output_path,
            json_name: parseJSONparams.json_name,
            s3_bucket: process.env.OUTPUT_S3_BUCKET,
            s3_key: 'kendra_json' + `/${parseJSONparams.json_name}`,
            kendra_s3_access_role: process.env.KENDRA_ROLE,
            region: process.env.REGION
        };
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Creating FAQ');
        const status = await create.handler(createFAQparams);

        // wait for index to complete creation
        // NOSONAR TODO: https://docs.aws.amazon.com/kendra/latest/dg/create-index.html
        qnabot.log(`Completed JSON converting to FAQ ${JSON.stringify(status)}`);

        await update_status(process.env.OUTPUT_S3_BUCKET, 'Sync Complete');
        qnabot.log('completed sync');
        return 'Synced';
    } catch (err) {
        await update_status(process.env.OUTPUT_S3_BUCKET, 'Error');
        qnabot.log(err);
        qnabot.log('failed sync');
        return err;
    }
};

async function update_status(bucket, new_stat) {
    const status_params = {
        Bucket: bucket,
        Key: 'status-export/qna-kendra-faq.txt'
    };

    // NOSONAR TODO: check the return value of the object in case of an error...
    let x = await s3.send(new GetObjectCommand(status_params));
    const readableStream = Buffer.concat(await x.Body.toArray());
    const config = JSON.parse(readableStream);
    config.status = new_stat;
    status_params.Body = JSON.stringify(config);
    x = await s3.send(new PutObjectCommand(status_params));
    qnabot.log(`updated config file status to ${new_stat}`);
    return x;
}
