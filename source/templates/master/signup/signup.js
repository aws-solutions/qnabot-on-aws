/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const approvedDomain = process.env.APPROVED_DOMAIN;

    if (approvedDomain) {
        const regex = new RegExp(`^[A-Za-z0-9._%+-]+@${approvedDomain}$`);
        if (event.request.userAttributes.email.match(regex)) {
            if (event.request.userAttributes.email_verified == 'True') {
                event.response.autoVerifyUser = true;
            }
            context.done(null, event);
        } else {
            const error = new Error('EMAIL_DOMAIN_DENIED_ERR');
            context.done(error, event);
        }
    } else {
        context.done(null, event);
    }
};
