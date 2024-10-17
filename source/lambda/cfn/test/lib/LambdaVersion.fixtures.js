/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.publishVersionCommandObject = function () {
    const response = {
        Version: '1'
    }

    return response;
}

exports.lambdaVersionParamsObject = function() {
    const response = {
        FunctionName: 'mock_function_name',
        _userId: 'mock_user_id',
    }

    return response;
}