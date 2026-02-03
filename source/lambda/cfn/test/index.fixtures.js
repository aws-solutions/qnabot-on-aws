/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.event = function() {
    const response = {
        RequestType: 'Create',
        ResourceType: 'Custom::LexBot',
        StackId: 'mock_stack_id',
        RequestId: 'mock_request_id',
        LogicalResourceId: 'mock_logical_resource_id',
        ResponseURL: 'https://www.something.com/test.html',
        ResourceProperties: {
            name: 'mock_name'
        },
        OldResourceProperties: {
            clarificationPrompt: {
                messages: [
                    {
                        content: 'I’m mock_content'
                    }
                ]
            },
            rejectionStatement: {
                messages: [
                    {
                        content: 'I’m mocked_rejection'
                    }
                ]
            }
        }
    }

    return response;
}

exports.endMock = jest.fn();
exports.writeMock = jest.fn();
exports.doneMock = jest.fn();