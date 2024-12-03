/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.handler = function (event, context, cb) {
    console.log(JSON.stringify(event, null, 2));
    event.res.message = 'Hi! This is your Custom Javascript Hook speaking!';
    cb(null, event);
};
