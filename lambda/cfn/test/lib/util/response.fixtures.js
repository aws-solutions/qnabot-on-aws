/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the License). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

exports.responseObject = function () {
    const response = {            
        context: 'mock_context', 
        responseStatus: 'mock_response_status',
        reason: 'mock_reason',
        physicalResourceId: 'mock_physical_resource_id',
        event: {
            StackId: 'mock_stack_id',
            RequestId: 'mock_request_id',
            LogicalResourceId: 'mock_logical_resource_id',
            ResponseURL: 'https://www.something.com/test.html'
        },
        responseData: 'mock_response_data'
    }

    return response;
}

exports.responseObjecWithNulls = function () {
    const response = {            
        context: 'mock_context', 
        responseStatus: 'mock_response_status',
        reason: 'mock_reason',
        event: {
            StackId: 'mock_stack_id',
            RequestId: 'mock_request_id',
            LogicalResourceId: 'mock_logical_resource_id',
            ResponseURL: 'https://www.something.com/test.html'
        }
    }

    return response;
}

exports.endMock = jest.fn();
exports.writeMock = jest.fn();

