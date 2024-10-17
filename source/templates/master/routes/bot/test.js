/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
