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
const util = require('./util');

const files = fs
    .readdirSync(`${__dirname}/..`)
    .filter(
        (x) => !x.match(
            /README.md|Makefile|index|test|outputs|coverage|__snapshots__|index.test.js|jest.config.js|.DS_Store/,
        ),
    )
    .map((x) => require(`../${x}`));

const lambdas = {};
_.forEach(_.assign.apply({}, files), (value, key) => {
    if (value.Type === 'AWS::Lambda::Function' && key !== 'ESInfoLambda') {
        const type = _.fromPairs(value.Properties.Tags.map((x) => [x.Key, x.Value])).Type;
        if (!lambdas[type]) {
            lambdas[type] = [];
        }
        lambdas[type].push(key);
    }
});

module.exports = function (main_offset) {
    const Lambda_title = util.Title('## Lambda Function', main_offset + 6);

    const lambda_widgets = _.map(lambdas, (value, key) => ({ list: value.map(util.lambda), name: key })).reduce(
        (accumulation, current) => {
            const title = util.Title(`### ${current.name}`, accumulation.offset);
            accumulation.offset += title.height;
            accumulation.list.push(title);

            current.list.map(util.place(accumulation.offset)).forEach((x) => {
                accumulation.list.push(x);
            });

            accumulation.offset = Math.max(...accumulation.list.map((x) => x.y)) + 6;
            return accumulation;
        },
        { list: [], offset: main_offset + 6 + Lambda_title.height },
    );
    return _.flatten([Lambda_title, lambda_widgets.list]);
};
