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

const Promise = require('./util/promise');
const crypto = Promise.promisifyAll(require('crypto'));
const _ = require('lodash');

module.exports = class Variable extends require('./base') {
    constructor() {
        super();
    }

    Create(params, reply) {
        _.forEach(params, (value, key) => {
            console.log(key, value);
            if (typeof value === 'object') {
                if (value.op === 'toLowerCase') {
                    params[key] = value.value.toLowerCase();
                }
            }
        });
        reply(null, id(params), params);
    }

    Update(ID, params, oldparams, reply) {
        this.Create(params, reply);
    }
};

function id(params) {
    console.log('Creating CFN variable: %j', params);

    const jsonString = JSON.stringify(params);
    crypto.createHash('sha256').update(jsonString).digest('hex');

    return Buffer.from(jsonString).toString('base64');
}
