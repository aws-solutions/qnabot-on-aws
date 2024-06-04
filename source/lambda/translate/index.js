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

const { TranslateClient, ListTerminologiesCommand, ImportTerminologyCommand } = require('@aws-sdk/client-translate');
const customSdkConfig = require('sdk-config/customSdkConfig');
const region = process.env.AWS_REGION;

exports.handler = async function (event, context) {
    try {
        console.log(event);
        if (event.requestContext.path == `/${event.requestContext.stage}/translate/list`) {
            const translate = new TranslateClient(customSdkConfig('C016', { region }));
            const listTerminologiesCmd = new ListTerminologiesCommand({});
            const result = await translate.send(listTerminologiesCmd);
            console.log(JSON.stringify(result));
            const mappedResult = result.TerminologyPropertiesList.map((data) => ({
                Name: data.Name,
                Description: data.Description,
                SourceLanguage: data.SourceLanguageCode,
                TargetLanguageCodes: data.TargetLanguageCodes,
                TermCount: data.TermCount,
            }));
            return {
                statusCode: 200,
                body: JSON.stringify(mappedResult),
                headers: {},
                isBase64Encoded: false,
            };
        }
        if (event.requestContext.path == `/${event.requestContext.stage}/translate/import`) {
            const body = JSON.parse(event.body);

            const translate = new TranslateClient(customSdkConfig('C016', { region }));

            console.log(body.file);
            const csvFile = Buffer.from(body.file, 'base64');
            const params = {
                Name: body.name,
                MergeStrategy: 'OVERWRITE',
                Description: body.description,
                TerminologyData: {
                    File: csvFile,
                    Format: 'CSV',
                },
            };
            const importTerminologyCmd = new ImportTerminologyCommand(params);
            const response = await translate.send(importTerminologyCmd);
            return {
                statusCode: 200,
                body: JSON.stringify({
                    Status: 'Success',
                    Error: '',
                    Response: response,
                }),
                headers: {},
                isBase64Encoded: false,
            };
        }
        return {
            statusCode: 404,
            headers: {},
            isBase64Encoded: false,
        };
    } catch (e) {
        console.log(e);
        return {
            statusCode: 200,
            body: JSON.stringify({ Status: 'Failed', Error: e.message }),
            headers: {},
            isBase64Encoded: false,
        };
    }
};
