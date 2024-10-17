/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
