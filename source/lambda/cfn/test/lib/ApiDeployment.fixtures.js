
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.createDeploymentCommandObject = function () {
    const response = {
        id: 'mock_id',
        Version: '1'
    }

    return response;
}

exports.updateStageCommandObject = function () {
    const response = {
        restApiId: 'mock_rest_api_id',
        stageName: 'mock_stage_name',
        patchOperations: [{
            op: 'replace',
            path: '/deploymentId',
            value: 'mock_id',
        }],
    }

    return response;
}

exports.apiDeploymentWithIdParamsObject = function() {
    const response = {
        FunctionName: 'mock_function_name',
        ApiDeploymentId: 'mock_api_deployment_id',
    }

    return response;
}
exports.apiDeploymentNoIdParamsObject = function() {
    const response = {
        FunctionName: 'mock_function_name'
    }

    return response;
}