/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const fs = require('fs');
const _ = require('lodash');
const util = require('./util');

const files = [
    require('../UpgradeAutoExport'),
    require('../assets'),
    require('../bucket'),
    require('../cfn'),
    require('../cognito'),
    require('../dynamodb'),
    require('../examples'),
    require('../exportstack'),
    require('../importstack'),
    require('../lambda-layers'),
    require('../lex'),
    require('../lex-build'),
    require('../lexv2-build'),
    require('../opensearch'),
    require('../policies.json'),
    require('../proxy-es'),
    require('../proxy-lex'),
    require('../roles.json'),
    require('../routes'),
    require('../s3'),
    require('../s3-clean'),
    require('../schemaLambda'),
    require('../settings'),
    require('../signup'),
    require('../solution-helper'),
    require('../tstallstack'),
    require('../var'),
];

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
