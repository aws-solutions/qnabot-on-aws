/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');
const qnabot = require('qnabot/logging');

function mergeNext(hit1, hit2) {
    if (hit1 === undefined) {
        return hit2;
    }
    qnabot.debug('Merge chained items');
    // merge plaintext answer
    if (hit1 && hit1.a) {
        hit2.a = hit1.a + hit2.a;
    }
    // merge markdown, if present in both items
    const md1 = _.get(hit1, 'alt.markdown');
    const md2 = _.get(hit2, 'alt.markdown');
    if (md1 && md2) {
        _.set(hit2, 'alt.markdown', `${md1}\n${md2}`);
    } else {
        qnabot.debug('Markdown field missing from one or both items; skip markdown merge');
    }
    // merge SSML, if present in both items
    let ssml1 = _.get(hit1, 'alt.ssml');
    let ssml2 = _.get(hit2, 'alt.ssml');
    if (ssml1 && ssml2) {
        // strip <speak> tags
        ssml1 = ssml1.replace(/<speak>|<\/speak>/g, '');
        ssml2 = ssml2.replace(/<speak>|<\/speak>/g, '');
        // concatenate, and re-wrap with <speak> tags
        _.set(hit2, 'alt.ssml', `<speak>${ssml1} ${ssml2}</speak>`);
    } else {
        qnabot.debug('SSML field missing from one or both items; skip SSML merge');
    }
    // build arrays of Lambda Hooks and arguments
    let lambdahooks = _.get(hit1, 'lambdahooks', []);
    // if hits1 doesn't have a lambdahooks field (no previous merge), then initialize using 'l' and 'args' from hit 1
    if (lambdahooks.length == 0) {
        lambdahooks = [
            {
                l: _.get(hit1, 'l'),
                args: _.get(hit1, 'args', []),
            },
        ];
    }
    lambdahooks.push({
        l: _.get(hit2, 'l'),
        args: _.get(hit2, 'args', []),
    });
    _.set(hit2, 'lambdahooks', lambdahooks);

    // all other fields inherited from item 2
    qnabot.debug('Items merged:', hit2);
    return hit2;
}
exports.mergeNext = mergeNext;
