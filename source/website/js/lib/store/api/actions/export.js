/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const _ = require('lodash');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');
const util = require('./../../../../capability/util');

async function getParameters(context, dynamodb) {
    const tableName = context.rootState.info.SettingsTable;

    const params = {
        TableName: tableName,
        FilterExpression: "SettingCategory <> :private",
        ExpressionAttributeValues: {
            ":private": {
                "S": "Private"
            }
        }
    };

    const custom_settings = {};
    const default_settings = {}
    let lastEvaluatedKey = null;
    do {
        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }

        try {
            const command = new ScanCommand(params);
            const response = await dynamodb.send(command);
            response.Items.forEach(item => {
                const unmarshalledItem = unmarshall(item);
                const settingName = unmarshalledItem.SettingName;
                const settingValue = unmarshalledItem.SettingValue;
                const defaultValue = unmarshalledItem.DefaultValue;
                const settingCategory = unmarshalledItem.SettingCategory;

                if (settingValue != "") {
                    custom_settings[settingName] = settingValue;
                }

                if (settingCategory == "Custom") {
                    custom_settings[settingName] = settingValue;
                }

                default_settings[settingName] = defaultValue;
            });

            lastEvaluatedKey = response.LastEvaluatedKey;
        } catch (error) {
            console.error('Error scanning DynamoDB table:', error);
            throw error;
        }
    } while (lastEvaluatedKey);

    let cloned_default = _.clone(default_settings)
    let merged_settings = _.merge(cloned_default, custom_settings)
    return [default_settings, custom_settings, merged_settings];
}

async function listSettings(context) {
    const credentials = context.rootState.user.credentials;
    
    const dynamodb = new DynamoDBClient({
        customUserAgent: util.getUserAgentString(context.rootState.info.Version, 'C022'),
        region: context.rootState.info.region, credentials
    });
    const response = await getParameters(context, dynamodb);
    return response;
}

const failed = false;
module.exports = {
    async startExport(context, opts) {
        const info = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        const settings = await listSettings(context);
        const merged = settings[2];
        let headers;
        if (merged.S3_PUT_REQUEST_ENCRYPTION && merged.S3_PUT_REQUEST_ENCRYPTION.length > 0) {
            headers = { 'x-amz-server-side-encryption': merged.S3_PUT_REQUEST_ENCRYPTION };
            console.log(`headers: ${headers}`);
        }
        await context.dispatch('_request', {
            url: `${info._links.exports.href}/${opts.name}`,
            method: 'put',
            headers: headers || undefined,
            body: opts.filter ? { filter: `${opts.filter}.*`, prefix: '' } : { prefix: '' },
        });
    },
    async startKendraSyncExport(context, opts) {
        console.log('Entering startKendraSyncExport function');
        const info = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });

        await context.dispatch('_request', {
            url: `${info._links.exports.href}/${opts.name}`,
            method: 'put',
            body: opts.filter ? { filter: `${opts.filter}.*`, prefix: 'kendra-' } : { prefix: 'kendra-' },
        });
    },
    async downloadExport(context, opts) {
        const credentials = context.rootState.user.credentials;
        const s3 = new S3Client({
            customUserAgent : util.getUserAgentString(context.rootState.info.Version, 'C011'),
            region: context.rootState.info.region, credentials
        });
        const result = await s3.send(new GetObjectCommand({
            Bucket: opts.bucket,
            Key: opts.key,
        }));

        const qa = await result.Body.transformToString();
        return `{"qna":[${qa.replace(/\n/g, ',\n')}]}`;
    },
    waitForExport(context, opts) {
        return new Promise(async (res, rej) => {
            await next(10);

            async function next(count) {
                try {
                    const response = await context.dispatch('_request', {
                        url: context.rootState.info._links.jobs.href,
                        method: 'get',
                    });
                    const result = await context.dispatch('_request', {
                        url: response._links.imports.href,
                        method: 'get',
                    });
                    const job = result.jobs.find((x) => x.id === opts.id);
                    if (job) {
                        res(job);
                    } else {
                        count > 0 ? setTimeout(() => next(--count), 200) : rej('timeout');
                    }
                } catch (error) {
                    rej(error);
                }
            }
        });
    },
    async listExports(context, opts) {
        const response = await context.dispatch('_request', {
            url: context.rootState.info._links.jobs.href,
            method: 'get',
        });
        return context.dispatch('_request', {
            url: response._links.exports.href,
            method: 'get',
        });
    },
    async getExport(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'get',
        });
    },
    async getExportByJobId(context, id) {
        return context.dispatch('_request', {
            url: `${context.rootState.info._links.jobs.href}/exports/${id}`,
            method: 'get',
        });
    },
    async deleteExport(context, opts) {
        return context.dispatch('_request', {
            url: opts.href,
            method: 'delete',
        });
    },
};
