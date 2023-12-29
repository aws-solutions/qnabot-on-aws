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

const hook = require('../../../lib/middleware/4_hook');
const util = require('../../../lib/middleware/util');
jest.mock('../../../lib/middleware/util');

const mock_request = {
    "_fulfillment":
        { "step": "" }
}

describe('when calling hook function', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should not invoke lambda if hooks or posthooks not defined', async () => {
        const mock_response = {
            "result": {
                "a": "QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback",
                "questions": [
                    {
                        "q": "What is QnABot"
                    }
                ],
                "type": "qna",
                "qid": "test.001",
                "l": "",
                "args": [],
                "lambdahooks": [
                ]
            }
        }
        await hook(mock_request, mock_response);
        expect(util.getLambdaArn).not.toHaveBeenCalled();
    });

    test('should not invoke lambda hook if failed to get lambda arn', async () => {
        mock_request._settings = {
        }
        const mock_response = {
            "result": {
                "a": "QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback",
                "questions": [
                    {
                        "q": "What is QnABot"
                    }
                ],
                "type": "qna",
                "qid": "test.001",
                "l": "",
                "args": [],
                "lambdahooks": [{
                    "args": ["mock_arg1", "mock_arg2"],
                    "l": "mock_lambda"
                }]
            }
        }
        util.getLambdaArn.mockReturnValue('');
        await hook(mock_request, mock_response);
        expect(util.invokeLambda).not.toHaveBeenCalled();
    });

    test('should invoke lambda if hooks and posthooks if configured', async () => {
        mock_request._settings = {
            "LAMBDA_POSTPROCESS_HOOK": "QNA-mock_lambda"
        }
        const mock_response = {
            "result": {
                "a": "QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback",
                "questions": [
                    {
                        "q": "What is QnABot"
                    }
                ],
                "type": "qna",
                "qid": "test.001",
                "l": "",
                "args": [],
                "lambdahooks": [{
                    "args": ["mock_arg1", "mock_arg2"],
                    "l": "mock_lambda"
                }]
            }
        }

        util.getLambdaArn.mockReturnValue('mock_lambda_arn');
        util.invokeLambda.mockReturnValue({ "req": mock_request, "res": mock_response });

        const event = await hook(mock_request, mock_response);
        const req = mock_request;
        const res = mock_response;
        expect(util.getLambdaArn).toHaveBeenCalledTimes(2);
        expect(util.invokeLambda).toHaveBeenCalledTimes(2);
        expect(event).toEqual({req, res});
    });

    test('should catch post-process lambda hook errors and continue execution without error', async () => {
        mock_request._settings = {
            "LAMBDA_POSTPROCESS_HOOK": "QNA-mock_lambda"
        }
        const mock_response = {
            "result": {
                "a": "QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback",
                "questions": [
                    {
                        "q": "What is QnABot"
                    }
                ],
                "type": "qna",
                "qid": "test.001",
                "l": "",
                "args": [],
                "lambdahooks": [{
                    "args": ["mock_arg1", "mock_arg2"],
                    "l": "mock_lambda"
                }]
            }
        }

        util.getLambdaArn.mockReturnValue('mock_lambda_arn');
        util.invokeLambda.mockRejectedValue('mock_error');

        const event = await hook(mock_request, mock_response);
        const req = mock_request;
        const res = mock_response;
        expect(util.getLambdaArn).toHaveBeenCalledTimes(2);
        expect(util.invokeLambda).toHaveBeenCalledTimes(2);
        expect(event).toEqual({req, res});
    });
});
