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

const fs = require('fs');
const _ = require('lodash');
const resource = require('../util/resource');
const lambda = require('../util/lambda');
const mock = require('../util/mock');

module.exports = {
    Bot: resource('bot'),
    AlexaApi: resource('alexa', { Ref: 'Bot' }),
    AlexaSchema: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        lambda: { 'Fn::GetAtt': ['UtteranceLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/utterance.get.vm`, 'utf8'),
        responseTemplate: fs.readFileSync(`${__dirname}/alexa.vm`, 'utf8'),
        resource: { Ref: 'AlexaApi' },
    }),
    BotPost: lambda({
        authorization: 'AWS_IAM',
        method: 'post',
        lambda: { 'Fn::GetAtt': ['LexBuildLambdaStart', 'Arn'] },
        resource: { Ref: 'Bot' },
        responseTemplate: fs.readFileSync(`${__dirname}/post.resp.vm`, 'utf8'),
    }),
    BotGet: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        subTemplate: fs.readFileSync(`${__dirname}/get.vm`, 'utf8'),
        lambda: { 'Fn::GetAtt': ['LexStatusLambda', 'Arn'] },
        resource: { Ref: 'Bot' },
        responseTemplate: fs.readFileSync(`${__dirname}/get.resp.vm`, 'utf8'),
    }),
    BotDoc: {
        Type: 'AWS::ApiGateway::DocumentationPart',
        Properties: {
            Location: {
                Type: 'RESOURCE',
                Path: '/bot',
            },
            Properties: JSON.stringify({
                description: '',
            }),
            RestApiId: { Ref: 'API' },
        },
    },
};
