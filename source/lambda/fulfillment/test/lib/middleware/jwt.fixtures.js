/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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
