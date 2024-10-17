/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.cognitoUrlObject = function () {
    const response = {
        Domain: 'mock_domain',
        LoginRedirectUrl: 'mock_login_redirect_url',
        response_type: 'mock_response_type',
        ClientId: 'mock_client_id'
    }

    return response;
}
