/** *******************************************************************************************************************
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
 ******************************************************************************************************************** */

const fs = require('fs');
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
