/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

function inIgnoreUtterances(utterance, ignoreUtterancesSetting) {
    const cleanedUtteranceList = ignoreUtterancesSetting.split(',').map((item) => item.replace(/[.!;-?]/g, '').trim().toLowerCase());
    const ignoreUtterances = new Set(cleanedUtteranceList);
    return ignoreUtterances.has(utterance.replace(/[.,!;-?]/g, '').trim().toLowerCase());
}
exports.inIgnoreUtterances = inIgnoreUtterances;
