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
const _ = require('lodash');

const js_example = fs.readdirSync(`${__dirname}/examples/js`)
    .filter((x) => !x.match(/(.*).(test|fixtures).js/)) // NOSONAR - javascript:S5852 - Cannot expose DOS attacks since this regex is only used during deployment
    .filter((x) => x.match(/(.*).js/)) // NOSONAR - javascript:S5852 - Cannot expose DOS attacks since this regex is only used during deployment
    .map((file) => {
        const name = file.match(/(.*).js/)[1]; // NOSONAR - javascript:S5852 - Cannot expose DOS attacks since this regex is only used during deployment
        return `ExampleJSLambda${name}`;
    });
const py_example = fs.readdirSync(`${__dirname}/examples/py`, { withFileTypes: true })
    .filter((x) => x.isFile())
    .map((x) => x.name)
    .filter((x) => x.match(/(.*).py/)) // NOSONAR - javascript:S5852 - Cannot expose DOS attacks since this regex is only used during deployment
    .map((file) => {
        const name = file.match(/(.*).py/)[1]; // NOSONAR - javascript:S5852 - Cannot expose DOS attacks since this regex is only used during deployment
        return `ExamplePYTHONLambda${name}`;
    });

const js_ext = fs.readdirSync(`${__dirname}/extensions/js_lambda_hooks`)
    .map((name) => `EXT${name}`);

const py_ext = fs.readdirSync(`${__dirname}/extensions/py_lambda_hooks`)
    .map((name) => `EXT${name}`);

exports.names = js_example.concat(py_example).concat(js_ext).concat(py_ext);

const out = _.fromPairs(exports.names.map((x) => [x, { Value: { 'Fn::GetAtt': [x, 'Arn'] } }]));

exports.outputs = out;
