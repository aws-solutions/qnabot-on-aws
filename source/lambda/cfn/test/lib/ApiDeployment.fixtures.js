
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