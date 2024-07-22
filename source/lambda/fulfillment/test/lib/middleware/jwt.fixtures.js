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

exports.jwtDecodeResponse = {
    "payload": "{ \"cognito:groups\": [\"Admins\"], \"email_verified\": true, \"cognito:username\": \"QnaAdmin\", \"token_use\": \"id\",\"auth_time\": 1696544694,\"exp\": 1696548294,\"email\": \"mock_email\"}",
    "signature": "mock_signature"
}

exports.decodedJwt = {
    "payload":
    {
        "cognito:groups": ["Admins"], "email_verified": true,
        "cognito:username": "QnaAdmin", "token_use": "id",
        "auth_time": 1696544694,
        "exp": 1696548294,
        "email": "mock_email"
    }, "signature": "mock_signature"
}
