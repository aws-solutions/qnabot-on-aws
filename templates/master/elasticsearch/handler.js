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

const aws = require('aws-sdk');

aws.config.region = process.env.AWS_REGION;
const es = new aws.ES();

exports.handler = function (event, context) {
    console.log(JSON.stringify(event, null, 2));

    if (event.RequestType !== 'Delete') {
        es.describeElasticsearchDomain({
            DomainName: event.ResourceProperties.name,
        }).promise()
            .then((info) => {
                send(event, context, SUCCESS, {
                    Name: DomainStatus.DomainName,
                    Arn: DomainStatus.ARN,
                    Endpoint: DomainStatus.Endpoints,
                });
            })
            .catch((x) => {
                console.log(x);
                send(event, context, FAILED);
            });
    } else {
        send(event, context, SUCCESS);
    }
};
