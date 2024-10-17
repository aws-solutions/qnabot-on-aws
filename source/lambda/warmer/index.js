/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const osWarmer = new (require('./lib'))();

exports.warmer = async function (event, context, callback) {
    await osWarmer.perform(event, context, callback);
    return 'complete';
};