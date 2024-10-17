/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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

