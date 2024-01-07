/*********************************************************************************************************************
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
 *********************************************************************************************************************/

const _ = require('lodash');
const qnabot = require('qnabot/logging');
const open_es = require('../es_query');
const { processSlots } = require('./processSlots');

async function processDialogEvent(req, res) {
    qnabot.log('Process Dialog Code Hook event');
    // retrieve QID item that was mapped to intent
    const qid = _.get(req, 'qid');
    if (qid) {
        const question = `QID::${qid}`;
        qnabot.log(`QID identified in request: ${qid}`);
        const query_params = {
            question,
            from: 0,
            size: 1,
        };
        const response = await open_es.run_query_es(req, query_params);
        qnabot.log('QID query response: ', JSON.stringify(response, null, 2));
        const hit = _.get(response, 'hits.hits[0]._source');
        res = processSlots(req, res, hit);
        _.set(res, 'session.qnabot_qid', qid);
    } else {
        qnabot.warn(
            'QID not identified in request. Intent name should have mapped to a QID. Unable to process Dialog Code Hook event',
        );
    }
    const event = { req, res };
    return event;
}
exports.processDialogEvent = processDialogEvent;
