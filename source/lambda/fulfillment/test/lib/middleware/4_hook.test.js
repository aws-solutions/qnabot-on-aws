/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const hook = require('../../../lib/middleware/4_hook');
const util = require('../../../lib/middleware/util');
const { applyGuardrail } = require('/opt/lib/bedrock/applyGuardrail.js');
jest.mock('../../../lib/middleware/util');

jest.mock('/opt/lib/bedrock/applyGuardrail.js', () => ({
    applyGuardrail: jest.fn().mockResolvedValue({
        text: 'mocked guardrail response',
        action: 'NONE'
    })
}));

const mock_request = {
    "_fulfillment":
        { "step": "" }
}
mock_request._settings = {
   "POSTPROCESS_GUARDRAIL_IDENTIFIER":"",
   "POSTPROCESS_GUARDRAIL_VERSION": ""
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
        mock_request._settings.LAMBDA_POSTPROCESS_HOOK = "QNA-mock_lambda";
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
        mock_request._settings.LAMBDA_POSTPROCESS_HOOK = "QNA-mock_lambda"
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

    test('should skip postprocess guardrail when identifiers are missing', async () => {
        const mock_request = {
            "_fulfillment": { "step": "" },
            "_settings": {
                "POSTPROCESS_GUARDRAIL_IDENTIFIER": "",
                "POSTPROCESS_GUARDRAIL_VERSION": ""
            }
        };
        const mock_response = {
            "message": "original message",
            "result": {
                "a": "test answer",
                "questions": [{ "q": "test question" }],
                "type": "qna",
                "qid": "test.001"
            }
        };

        await hook(mock_request, mock_response);
        expect(applyGuardrail).not.toHaveBeenCalled();
    });

    test('should modify response when guardrail intervenes', async () => {
        const mock_request = {
            "_fulfillment": { "step": "" },
            "_settings": {
                "POSTPROCESS_GUARDRAIL_IDENTIFIER": "test-id",
                "POSTPROCESS_GUARDRAIL_VERSION": "1.0",
                "ERRORMESSAGE": "Unexpected error occurred while processing request."
            }
        };
        const mock_response = {
            "message": "original message",
            "session": { "appContext": { "altMessages": {} } },
            "appContext": { "altMessages": {} },
            "result": {
                "a": "test answer",
                "questions": [{ "q": "test question" }],
                "type": "qna",
                "qid": "test.001",
                "alt": {}
            }
        };

        applyGuardrail.mockResolvedValueOnce({
            text: 'modified message',
            guardrailAction: 'GUARDRAIL_INTERVENED'
        });

        const result = await hook(mock_request, mock_response);

        expect(applyGuardrail).toHaveBeenCalledWith(
            'test-id',
            '1.0',
            'OUTPUT',
            'original message',
            'Unexpected error occurred while processing request.'
        );
        expect(result.res.message).toBe('modified message');
        expect(result.res.session.appContext.altMessages.markdown).toBe('modified message');
        expect(result.res.session.appContext.altMessages.ssml).toBe('modified message');
        expect(result.res.result.alt.markdown).toBe('modified message');
        expect(result.res.result.alt.ssml).toBe('modified message');
        expect(result.res.answerSource).toBe('POSTPROCESS GUARDRAIL');
    });

    test('should not modify response when guardrail does not intervene', async () => {
        const mock_request = {
            "_fulfillment": { "step": "" },
            "_settings": {
                "POSTPROCESS_GUARDRAIL_IDENTIFIER": "test-id",
                "POSTPROCESS_GUARDRAIL_VERSION": "1.0",
                "ERRORMESSAGE": "Unexpected error occurred while processing request."
            }
        };
        const mock_response = {
            "message": "original message",
            "result": {
                "a": "test answer",
                "questions": [{ "q": "test question" }],
                "type": "qna",
                "qid": "test.001"
            }
        };

        applyGuardrail.mockResolvedValueOnce({
            text: undefined,
            guardrailAction: 'NONE'
        });

        const result = await hook(mock_request, mock_response);

        expect(applyGuardrail).toHaveBeenCalledWith(
            'test-id',
            '1.0',
            'OUTPUT',
            'original message',
            'Unexpected error occurred while processing request.'
        );
        expect(result.res.message).toBe('original message');
    });
});

