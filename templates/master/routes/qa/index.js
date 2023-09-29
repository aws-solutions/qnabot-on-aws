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
const resource = require('../util/resource');
const lambda = require('../util/lambda');

module.exports = {
    Questions: resource('questions'),
    QuestionsGet: lambda({
        authorization: 'AWS_IAM',
        method: 'get',
        lambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/single/get.vm`, 'utf8'),
        responseTemplate: fs.readFileSync(`${__dirname}/single/get.resp.vm`, 'utf8'),
        resource: { Ref: 'Questions' },
        parameterLocations: {
            'method.request.querystring.query': false,
            'method.request.querystring.topic': false,
            'method.request.querystring.from': false,
            'method.request.querystring.filter': false,
            'method.request.querystring.order': false,
            'method.request.querystring.perpage': false,
        },
    }),
    QuestionsDelete: lambda({
        authorization: 'AWS_IAM',
        method: 'delete',
        lambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/collection/delete.vm`, 'utf8'),
        responseTemplate: fs.readFileSync(`${__dirname}/collection/delete.resp.vm`, 'utf8'),
        defaultResponse: 204,
        resource: { Ref: 'Questions' },
    }),
    Question: resource('{ID}', { Ref: 'Questions' }),
    QuestionHead: lambda({
        authorization: 'AWS_IAM',
        method: 'head',
        errors: [{
            SelectionPattern: '.*status":404.*',
            StatusCode: 404,
            ResponseTemplates: {
                'application/json': fs.readFileSync(`${__dirname}/../error/error.vm`, 'utf8'),
            },
        }],
        lambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/single/head.vm`, 'utf8'),
        responseTemplate: fs.readFileSync(`${__dirname}/single/head.resp.vm`, 'utf8'),
        resource: { Ref: 'Question' },
        parameterLocations: {
            'method.request.path.Id': true,
        },
    }),
    QuestionPut: lambda({
        authorization: 'AWS_IAM',
        method: 'put',
        lambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/single/put.vm`, 'utf8'),
        responseTemplate: fs.readFileSync(`${__dirname}/single/put.resp.vm`, 'utf8'),
        resource: { Ref: 'Question' },
        parameterLocations: {
            'method.request.path.Id': true,
        },
        defaultResponse: 201,
    }),
    QuestionsOptions: lambda({
        authorization: 'AWS_IAM',
        method: 'options',
        lambda: { 'Fn::GetAtt': ['SchemaLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/single/options.vm`, 'utf8'),
        resource: { Ref: 'Questions' },
    }),
    QuestionDelete: lambda({
        authorization: 'AWS_IAM',
        method: 'delete',
        lambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/single/delete.vm`, 'utf8'),
        responseTemplate: fs.readFileSync(`${__dirname}/single/delete.resp.vm`, 'utf8'),
        resource: { Ref: 'Question' },
        defaultResponse: 204,
        parameterLocations: {
            'method.request.path.Id': true,
        },
    }),
};
