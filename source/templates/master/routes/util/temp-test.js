/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const Velocity = require('velocity');
const jsonpath = require('jsonpath');

exports.run = function (name, context, test) {
    const temp = new Velocity.Engine({
        template: `${name}.vm`,
        debug: true,
    });

    const result = temp.render(Object.assign(require('./context.js'), context));
    console.log(result);
    try {
        const json = JSON.parse(result);
        test.ok(true);
        test.done();
    } catch (e) {
        console.log(e);
        test.ok(false);
        test.done();
    }
};

exports.input = function (body) {
    return {
        input: {
            params: (x) => body[x],
            path: (x) => jsonpath({ json: body, path: x })[0],
            json: (x) => JSON.stringify(jsonpath({ json: body, path: x })[0]),
        },
    };
};
