/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// use DEFAULT_SETTINGS_PARAM as encryption key unique to this QnABot installation
const key = process.env.DEFAULT_SETTINGS_PARAM;
if (!key) {
    throw new Error(
        'DEFAULT_SETTINGS_PARAM environment variable is not set. '
        + 'This variable must be configured in the FulfillmentLambda and ESQueryLambda '
        + 'environment variables, referencing the DefaultQnABotSettings SSM parameter '
        + "(e.g., { Ref: 'DefaultQnABotSettings' })."
    );
}
const encryptor = require('simple-encryptor')(key);

exports.encryptor = encryptor;
