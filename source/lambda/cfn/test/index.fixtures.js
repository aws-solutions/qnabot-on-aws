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

exports.event = function() {
    const response = {
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