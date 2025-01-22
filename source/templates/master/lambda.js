/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
