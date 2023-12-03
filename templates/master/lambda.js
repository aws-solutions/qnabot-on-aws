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
const util = require('../util');

const files = fs.readdirSync(`${__dirname}`)
    .filter((x) => !x.match(/README.md|Makefile|dashboard|index|test|.DS_Store/))
    .map((x) => require(`./${x}`));

const lambdas = [];
_.forEach(_.assign.apply({}, files), (value, key) => {
    if (value.Type === 'AWS::Lambda::Function') {
        const type = _.fromPairs(value.Properties.Tags.map((x) => [x.Key, x.Value])).Type;
        if (type === 'Api' || type == 'Service') {
            lambdas.push([
                `InvokePermission${key}`,
                permission(key),
            ]);
        }
    }
});

module.exports = Object.assign(
    _.fromPairs(lambdas),
);

function permission(name) {
    return {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            Action: 'lambda:InvokeFunction',
            FunctionName: { 'Fn::GetAtt': [name, 'Arn'] },
            Principal: 'apigateway.amazonaws.com',
        },
    };
}
