/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

process.argv.push('--debug');
const { run } = require('../util/temp-test');
const { input } = require('../util/temp-test');

module.exports = {
    list: (test) => run(`${__dirname}/` + 'list', input({
        perpage: 100,
        token: '',
    }), test),
    list: (test) => run(`${__dirname}/` + 'photos', input({
        perpage: 100,
        token: '',
    }), test),
    async handler(test) {
        const output = await require('../../../../bin/exports')('dev/bucket');
        try {
            require('./handler').documents({
                bucket: output.Bucket,
                prefix: '',
                root: 'example.com',
            }, {}, (err, result) => {
                console.log(result);
                test.ifError(err);
                test.ok(result);
                test.done();
            });
        } catch (e) {
            test.ifError(e);
            test.done();
        }
    },
    async handlerPhoto(test) {
        const output = await require('../../../../bin/exports')('dev/bucket');
        try {
            require('./handler').photos({
                bucket: output.Bucket,
                prefix: '',
                root: 'example.com',
            }, {}, (err, result) => {
                console.log(result);
                test.ifError(err);
                test.ok(result);
                test.done();
            });
        } catch (e) {
            test.ifError(e);
            test.done();
        }
    },
};
