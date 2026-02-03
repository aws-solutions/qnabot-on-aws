/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const subject = 'QnABot Signup Verification Code';

function message(code) {
    return `Hello, Your QnABot verification code is: ${code}`;
}

function complete(context, error, event) {
    if (context.done) {
        context.done(error, event);
    } else if (error) {
        throw error;
    } else {
        return event;
    }
}

function isEmailApproved(email, approvedDomain) {
    if (!approvedDomain) return true;
    
    // Escape special regex characters in the domain
    const escapedDomain = approvedDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^[A-Za-z0-9._%+-]+@${escapedDomain}$`);
    return email.match(regex);
}

function setEmailResponse(event) {
    event.response.emailSubject = subject;
    event.response.emailMessage = message(event.request.codeParameter);
}

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        const approvedDomain = process.env.APPROVED_DOMAIN;
        const email = event.request.userAttributes.email;
        
        if (!isEmailApproved(email, approvedDomain)) {
            const error = new Error('EMAIL_DOMAIN_DENIED_ERR');
            return complete(context, error, event);
        }
        
        setEmailResponse(event);
        return complete(context, null, event);
    } catch (error) {
        return complete(context, error, event);
    }
};
