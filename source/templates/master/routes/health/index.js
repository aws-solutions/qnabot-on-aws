/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
