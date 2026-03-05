/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

function isEmailApproved(email, approvedDomain) {
    if (!approvedDomain) return true;
    
    // Escape special regex characters in the domain
    const escapedDomain = approvedDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^[A-Za-z0-9._%+-]+@${escapedDomain}$`);
    return email.match(regex);
}

function handleAutoVerify(event) {
    if (event.request.userAttributes.email_verified === 'True') {
        event.response.autoVerifyEmail = true;
        event.response.autoConfirmUser = true;
    }
}

exports.handler = async (event, context) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Ensure response object exists
        if (!event.response) {
            event.response = {};
        }
        
        const approvedDomain = process.env.APPROVED_DOMAIN;
        const email = event.request.userAttributes.email;
        
        if (!isEmailApproved(email, approvedDomain)) {
            // Throw error to reject user signup
            throw new Error('EMAIL_DOMAIN_DENIED_ERR');
        }
        
        handleAutoVerify(event);
        
        console.log('Returning event:', JSON.stringify(event, null, 2));
        
        // Return the event object for Cognito
        return event;
    } catch (error) {
        console.log('Error in handler:', error);
        // Re-throw to let Cognito handle the rejection
        throw error;
    }
};
