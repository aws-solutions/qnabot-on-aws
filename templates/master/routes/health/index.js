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
    Health: resource('health'),
    HealthGet: lambda({
        method: 'get',
        authorization: 'AWS_IAM',
        lambda: { 'Fn::GetAtt': ['ESProxyLambda', 'Arn'] },
        subTemplate: fs.readFileSync(`${__dirname}/health.vm`, 'utf8'),
        responseTemplate: fs.readFileSync(`${__dirname}/health.resp.vm`, 'utf8'),
        resource: { Ref: 'Health' },
    }),
};
