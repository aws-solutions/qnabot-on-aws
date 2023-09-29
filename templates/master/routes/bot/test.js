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

process.argv.push('--debug');
const Velocity = require('velocity');
const { run } = require('../util/temp-test');
const { input } = require('../util/temp-test');

module.exports = {
    get: (test) => run(`${__dirname}/get`, {}, test),
    getresp: (test) => run(`${__dirname}/get.resp`, input({
        status: 'BUILDING',
        build: { test: 'a' },
        abortStatement: {
            messages: [
                { content: '2' },
                { content: '3' },
            ],
        },
        clarificationPrompt: {
            messages: [
                { content: '1' },
                { content: '4' },
            ],
        },
    }), test),
    post: (test) => run(`${__dirname}/` + 'post', {}, test),
    resp: (test) => run(`${__dirname}/` + 'post.resp', {}, test),
    utterance: {
        get: (test) => run(`${__dirname}/` + 'utterance.get', {}, test),
        alexa: (test) => run(`${__dirname}/` + 'alexa', {
            input: {
                path() {
                    return {
                        enumerationValues: [
                            { value: 'thin, or thin' },
                            { value: 'thick' },
                        ],
                    };
                },
            },
        }, test),
    },
};
