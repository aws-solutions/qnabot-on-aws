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

const _ = require('lodash');
const aws = require('../aws');

const lambda = new aws.Lambda();
const qnabot = require('qnabot/logging');

exports.getLambdaArn = function (name) {
    const match = name.match(/QNA:(.*)/);
    if (match) {
        return process.env[match[1]] || name;
    }
    return name;
};

exports.invokeLambda = async function (params) {
    qnabot.log(`Invoking ${params.FunctionName}`);
    const payload = params.Payload || JSON.stringify({
        req: params.req,
        res: params.res,
    });
    qnabot.log('payload');
    qnabot.log(payload);
    const result = await lambda.invoke({
        FunctionName: params.FunctionName,
        InvocationType: params.InvocationType || 'RequestResponse',
        Payload: payload,
    }).promise();

    qnabot.log(result);
    if (!result.FunctionError) {
        try {
            if (result.Payload) {
                const parsed = JSON.parse(result.Payload);
                qnabot.log('Response', JSON.stringify(parsed, null, 2));
                return parsed;
            }
        } catch (e) {
            qnabot.log(e);
            throw e;
        }
    } else {
        let error_message;

        switch (params.req._type) {
        case 'LEX':
            error_message = new LexError(_.get(params, 'req._settings.ERRORMESSAGE', 'Exception from Lambda Hook'));
            break;
        case 'ALEXA':
            error_message = new AlexaError(_.get(params, 'req._settings.ERRORMESSAGE', 'Exception from Lambda Hook'));
            break;
        }

        qnabot.log('Error Response', JSON.stringify(error_message, null, 2));
        throw error_message;
    }
};

function Respond(message) {
    this.action = 'RESPOND';
    this.message = message;
}

function AlexaError(errormessage) {
    this.action = 'RESPOND';
    this.message = {
        version: '1.0',
        response: {
            outputSpeech: {
                type: 'PlainText',
                text: errormessage,
            },
            card: {
                type: 'Simple',
                title: 'Processing Error',
                content: errormessage,
            },
            shouldEndSession: true,
        },
    };
}

function LexError(errormessage) {
    this.action = 'RESPOND';
    this.message = {
        dialogAction: {
            type: 'Close',
            fulfillmentState: 'Fulfilled',
            message: {
                contentType: 'PlainText',
                content: errormessage,
            },
        },
    };
}
