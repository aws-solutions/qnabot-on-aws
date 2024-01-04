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

const { fromEnv } = require('@aws-sdk/credential-providers');
const _ = require('lodash');

module.exports = _.memoize((address) => require('elasticsearch').Client({
        requestTimeout: 10 * 1000,
        pingTimeout: 10 * 1000,
        hosts: process.env.ADDRESS,
        connectionClass: require('http-aws-es'),
        defer() {
            let resolve, reject;
            const promise = new Promise((res, rej) => {
                resolve = res;
                reject = rej;
            
            });
	        return { promise, resolve, reject };
        },
        amazonES: {
            region: process.env.AWS_REGION,
            credentials: fromEnv()
        }
    }));