/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const lambdas = require('./lambdas');
const opensearch = require('./opensearch');
const util = require('./util');

let widgets = [util.Title('# QnABot:${AWS::StackName} Dashboard', 0)];

widgets = widgets.concat(opensearch(util.yOffset(widgets)));
widgets = widgets.concat(lambdas(util.yOffset(widgets)));

module.exports = { widgets };
