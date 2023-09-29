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

const Promise = require('bluebird');
const aws = require('aws-sdk');

aws.config.setPromisesDependency(Promise);
aws.config.region = process.env.AWS_REGION || 'us-east-1';
aws.config.signatureVersion = 'v4';
const cw = new aws.CloudWatchLogs();

Promise.if = function (test, func) {
    return Promise.resolve().if(test, func);
};

Promise.prototype.if = function (test, func) {
    const self = this;
    if (typeof test === 'function') {
        return self.then((result) => (test(result) ? self.then(func) : self));
    }
    return test ? self.then(func) : self;
};

Promise.prototype.log = function (label) {
    return this.tap((x) => console.log(label, x));
};
Promise.prototype.logCatch = function (label) {
    return this.tapCatch((x) => console.log(label, x));
};
Promise.prototype.retry = function (fnc, retries = 10) {
    return this.then((results) => Promise.retry(() => fnc(results), retries));
};
Promise.retry = function (fnc, retries = 10) {
    return new Promise((res, rej) => {
        const next = function (count) {
            console.log(`retries left:${count}`);
            fnc().then(res).catch((err) => {
                if (count > 0) {
                    return setTimeout(() => next(--count), 1000);
                }
                rej(err);
            });
        };
        next(retries);
    });
};

module.exports = Promise;
