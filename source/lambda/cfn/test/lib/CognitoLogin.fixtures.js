/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.userPoolClientWithS3ParamsObject = function () {
    const response = {
        ClientId: 'mock_client_id',
        UserPool: 'mock_user_pool',
        CallbackUrl: 'mock_callback_url',
        LoginCallbackUrls: ['mock_login_url'],
        LogoutCallbackUrls: ['mock_logout_callback_url'],
        ImageBucket: 'mock_image_bucket',
        ImageKey: 'mock_image_key',
        Image: 'mock_image',
        CSS: 'mock_css'
    }

    return response;
}             

exports.userPoolClientParamsObject = function () {
    const response = {
        ClientId: 'mock_client_id',
        UserPool: 'mock_user_pool',
        CallbackUrl: 'mock_callback_url',
        LoginCallbackUrls: ['mock_login_url'],
        LogoutCallbackUrls: ['mock_logout_callback_url'],
        CSS: 'mock_css'
    }
    
    return response;
}
                