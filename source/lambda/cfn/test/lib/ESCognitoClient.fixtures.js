/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.esCognitoClientObject = function () {
    const response = {
        UserPool: 'mock_user_pool',
        DomainName: 'mock_client_name'
    }

    return response;
}

exports.listUserPoolClientObject = function () {
    const response = {
        UserPoolClients: [
            {
                ClientId: 'mock_client_id',
                ClientName: 'mock_client_name',
                UserPoolId: 'mock_user_pool_id',
            }
        ]
    }

    return response;
}


exports.describeUserPoolClientObject = function () {
    const response = {
        UserPoolClient: { 
            UserPoolId: 'mock_user_pool_id',
            ClientName: 'mock_client_name',
            ClientId: 'mock_client_id',
            ClientSecret: 'mock_client_secret'
        }
    }
    return response;
}

