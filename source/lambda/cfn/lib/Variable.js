/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const crypto = require('crypto');
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
