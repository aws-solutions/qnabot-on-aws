/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const fs = require('fs');
const _ = require('lodash');

const files = [
    require('./UpgradeAutoExport'),
    require('./appregistry'),
    require('./assets'),
    require('./bucket'),
    require('./cfn'),
    require('./cognito'),
    require('./dashboard'),
    require('./dynamodb'),
    require('./examples'),
    require('./exportstack'),
    require('./importstack'),
    require('./kendrasns'),
    require('./lambda-layers'),
    require('./lex'),
    require('./lex-build'),
    require('./lexv2-build'),
    require('./opensearch'),
    require('./policies.json'),
    require('./proxy-es'),
    require('./proxy-lex'),
    require('./roles.json'),
    require('./routes'),
    require('./s3'),
    require('./s3-clean'),
    require('./sagemaker-embeddings-stack'),
    require('./sagemaker-qa-summarize-llm-stack'),
    require('./schemaLambda'),
    require('./settings'),
    require('./signup'),
    require('./solution-helper'),
    require('./tstallstack'),
    require('./var'),
];

const lambdas = [];
_.forEach(_.assign.apply({}, files), (value, key) => {
    if (value.Type === 'AWS::Lambda::Function') {
        const type = _.fromPairs(value.Properties.Tags.map((x) => [x.Key, x.Value])).Type;
        if (type === 'Api' || type == 'Service') {
            lambdas.push([`InvokePermission${key}`, permission(key)]);
        }
    }
});

module.exports = Object.assign(_.fromPairs(lambdas));

function permission(name) {
    return {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': [name, 'Arn'] },
            Principal: 'apigateway.amazonaws.com',
            SourceAccount: { Ref: 'AWS::AccountId' },   
        },
    };
}
