/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.handler = async (event, context) => {
    console.log(JSON.stringify(event, null, 2));
    event.res.message = 'Hi! This is your Custom Javascript Hook speaking!';
    return event;
};
