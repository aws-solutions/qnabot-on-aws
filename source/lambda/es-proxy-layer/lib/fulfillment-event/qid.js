/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

function utteranceIsQid(utterance) {
    return utterance.toLowerCase().startsWith('qid::');
}

exports.utteranceIsQid = utteranceIsQid;
