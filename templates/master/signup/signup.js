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
