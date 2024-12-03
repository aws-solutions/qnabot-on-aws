/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.getUserAgentString = function (version, capability) {
    const userAgent = [[`AWSSOLUTION/SO0189/v${version}`], [`AWSSOLUTION-CAPABILITY/SO0189-${capability}/v${version}`]];
    return userAgent;
}