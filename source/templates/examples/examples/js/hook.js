/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.handler = function (event, context, cb) {
    const today = new Date();
    const curHr = (today.getHours() - 8 + 24) % 24;
    let message;

    console.log(JSON.stringify(event, null, 2));
    if (curHr < 12) {
        message = 'good morning, ';
    } else if (curHr < 18) {
        message = 'good afternoon, ';
    } else {
        message = 'good evening, ';
    }
    event.res.message = message + event.res.message;
    cb(null, event);
};
