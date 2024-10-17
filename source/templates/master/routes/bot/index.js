/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const resource = require('../util/resource');
const lambda = require('../util/lambda');

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
