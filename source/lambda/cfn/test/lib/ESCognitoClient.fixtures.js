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

