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

// start connection
const _ = require('lodash');
const qnabot = require('qnabot/logging');
const qna_settings = require('qnabot/settings');
const { processFulfillmentEvent } = require('./fulfillment-event/processFulfillmentEvent');
const { processDialogEvent } = require('./dialog-event/processDialogEvent');

module.exports = async function (req, res) {
    qna_settings.set_environment_variables(req._settings);
    let event = {};
    if (_.get(req, 'invocationSource') === 'DialogCodeHook') {
        event = await processDialogEvent(req, res);
    } else {
        event = await processFulfillmentEvent(req, res);
    }
    qnabot.debug('RESULT', JSON.stringify(event));
    return event;
};
