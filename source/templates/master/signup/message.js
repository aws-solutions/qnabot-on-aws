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
            event.response.emailSubject = subject;
            event.response.emailMessage = message(
                event.request.codeParameter,
                event.request.usernameParameter,
            );
            context.done(null, event);
        } else {
            const error = new Error('EMAIL_DOMAIN_DENIED_ERR');
            context.done(error, event);
        }
    } else {
        event.response.emailSubject = subject;
        event.response.emailMessage = message(event.request.codeParameter);
        context.done(null, event);
    }
};

const subject = 'QnABot Signup Verification Code';
function message(code, name) {
    return `Hello, Your QnABot verification code is: ${code}`;
}
