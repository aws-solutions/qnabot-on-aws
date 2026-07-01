/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const specialtyBotRouter = require('../../../lib/middleware/specialtyBotRouter');
const _ = require('lodash');
const botRouterFixtures = require('./specialtyBotRouter.fixtures')
const awsMock = require('aws-sdk-client-mock');
const { LexRuntimeV2 } = require('@aws-sdk/client-lex-runtime-v2');
const { Lambda, InvokeCommand } = require('@aws-sdk/client-lambda');
const multilanguage = require('../../../lib/middleware/multilanguage');
const lambdaMock = awsMock.mockClient(Lambda);
jest.mock('../../../lib/middleware/multilanguage');
jest.mock('@aws-sdk/client-lex-runtime-service');
jest.mock('@aws-sdk/client-lex-runtime-v2');


const translateSpy = multilanguage.get_translation.mockImplementation((message, _) => {
    return Promise.resolve(message);
});

const comprehendSpy = multilanguage.get_userLanguages.mockImplementation((_) => {
    return Promise.resolve({Languages: [{
        "LanguageCode": "en",
        "Score": 1
    }]});
});

describe('when calling routeRequest function with Lambda as target or with exit message', () => {
    
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return welcome message when user provides one of the exit message', async () => {
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("exit"),
            botRouterFixtures.createResponseObject(), "mockHook", null);
        expect(response.res.message).toEqual(" Welcome back to QnABot.");
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(response.res.session.appContext.altMessages).toEqual({ "html": " <i> Welcome back to QnABot. </i>" });
    });

    test('should block cross-account lambda:: invocation', async () => {
        process.env.AWS_ACCOUNT_ID = '111122223333';
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lambda::arn:aws:lambda:us-east-1:444455556666:function:evil", null);
        expect(lambdaMock.calls(InvokeCommand)).toHaveLength(0);
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
    });

    test('should return lambda response when target bot is lambda function', async () => {
        lambdaMock.on(InvokeCommand).resolves(botRouterFixtures.lambdaResponse);
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lambda::mockRoutingLambda", null);
        expect(response.res.message).toEqual("mockLambdaResponse");
    });

    test('should end use of Specialty Bot when target bot is lambda function & bot dialogState is Fulfilled', async () => {
        lambdaMock.on(InvokeCommand).resolves({
            "Payload": '{"message":"mockLambdaResponse.", "dialogState": "Fulfilled",  "sessionAttributes":[]}'
        });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lambda::mockRoutingLambda", null);
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(response.res.message).toEqual("mockLambdaResponse. Welcome back to QnABot.");
        expect(response.res.session.appContext.altMessages).toEqual({"html": "mockLambdaResponse. <i> Welcome back to QnABot. </i>"});
    });

});

describe('when calling routeRequest function with LexV2 as target', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return message returned by LexV2 bot response', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message.", "testIntent"));
            });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message. Welcome back to QnABot.");
    });

    test('should return message returned by LexV2 bot response with Special Character Id', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message.", "testIntent"));
            });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObjectWithSpecialUserId("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message. Welcome back to QnABot.");
    });

    test('should return message from bot response when LexV2 bot responds with intent name FallbackIntent or intent state Failed', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("", "Test Message.", "FallbackIntent"));
            });
        let response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message.");


        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("Failed", "Test Message.", "testIntent"));
            });
        response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message.");
    });

    test('should return original response object, when using LexV2 & response messages contains only ImageResponseCard message', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                const mockResponse = botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message.", "testIntent");
                mockResponse.messages = [
                    {
                        "contentType": "ImageResponseCard",
                        "imageResponseCard": {}
                    }
                ]
                callback(null, mockResponse);
            });
        const mockResponseParam = botRouterFixtures.createResponseObject();
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponseParam, "lexv2::test_bot", null);
        expect(response.res).toEqual(mockResponseParam);
    });

    test('should contain responseCard details in response, when using LexV2 and response messages contains ImageResponseCard & PlainText message, ', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                const mockResponse = botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message.", "testIntent");
                mockResponse.messages = [
                    {
                        "contentType": "ImageResponseCard",
                        "imageResponseCard": {}
                    },
                    {
                        "content": "Test Message.",
                        "contentType": "PlainText"
                    }
                ]
                callback(null, mockResponse);
            });
        const mockResponseParam = botRouterFixtures.createResponseObject();
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponseParam, "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message. Welcome back to QnABot.");
        expect(response.res.result.r).toEqual({ "send": true});
    });

    test('should return error if LexV2 responds with Error', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(new Error("Mock Error"), null);
            });
        await expect(specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null)).rejects.toEqual('Lex V2 client request error:Error: Mock Error');
    });


    test('when response contains card buttons', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message.", "testIntent"));
            });
        const mockResponse = botRouterFixtures.createResponseObject();
        mockResponse.card = { "buttons": [{ "text": "test Button" }] };
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponse, "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message. Welcome back to QnABot.");
        expect(response.res.card.buttons).toEqual([{ "text": "test Button" }]);
    });


    test('should return response passed in parameter if LexV2 response does not contain any messages', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "", "testIntent"));
            });
        const mockResponse = botRouterFixtures.createResponseObject;
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponse, "lexv2::test_bot", null);
        expect(response.res).toEqual(mockResponse);
    });

    test('when LexV2 response contains slots', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {

                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message.", "",
                    { "qnaslot": { "shape": "Scalar", "value": { "originalValue": "test value", "interpretedValue": "test value" } } }));
            });
        const mockResponse = botRouterFixtures.createResponseObject;
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponse, "lexv2::test_bot", null);
        expect(response.res.message).toEqual("Test Message. Welcome back to QnABot.");
    });
});

describe('when calling routeRequest with mergeAttributesToReceive and sBAttributesToReceive', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should merge session attributes from specialty bot response when sBAttributesToReceive is set', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                const mockResponse = botRouterFixtures.getLexV2Response('ReadyForFulfillment', 'Test Message.', 'testIntent');
                mockResponse.sessionState.sessionAttributes = { myAttribute: 'mergedValue' };
                callback(null, mockResponse);
            });
        const req = botRouterFixtures.createRequestObject('What is QnABot');
        req.session.qnabotcontext.sBAttributesToReceive = 'myAttribute';
        req.session.qnabotcontext.sBAttributesToReceiveNamespace = 'testNamespace';
        const response = await specialtyBotRouter.routeRequest(req,
            botRouterFixtures.createResponseObject(), 'lexv2::test_bot', null);
        expect(response.res.message).toEqual('Test Message. Welcome back to QnABot.');
        // Verify the attribute was merged into the session under the configured namespace
        expect(response.res.session.testNamespace.myAttribute).toEqual('mergedValue');
    });

    test('should not break lambda path when specialtyBotMergeAttributes is set', async () => {
        process.env.AWS_ACCOUNT_ID = '111122223333';
        const lambdaPayload = {
            message: 'Lambda Response',
            dialogState: 'ElicitSlot',
            sessionAttributes: { myAttribute: 'lambdaAttrValue' },
        };
        const { Lambda, InvokeCommand } = require('@aws-sdk/client-lambda');
        const awsMock = require('aws-sdk-client-mock');
        const lambdaMockLocal = awsMock.mockClient(Lambda);
        lambdaMockLocal.on(InvokeCommand).resolves({
            Payload: JSON.stringify(lambdaPayload),
        });
        const req = botRouterFixtures.createRequestObject('Hello');
        req.session.myAttribute = 'lambdaAttrValue';
        req.session.qnabotcontext.specialtyBotMergeAttributes = 'myAttribute';
        const response = await specialtyBotRouter.routeRequest(req,
            botRouterFixtures.createResponseObject(), 'lambda::arn:aws:lambda:us-east-1:111122223333:function:mockBot', null);
        // specialtyBotMergeAttributes caused myAttribute to be sent in the lambda payload;
        // the response message should reflect the lambda reply
        expect(response.res.message).toEqual('Lambda Response');
    });
});

describe('when calling routeRequest with multi-language support', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should handle translate_res when ENABLE_MULTI_LANGUAGE_SUPPORT is true and language differs', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response('ReadyForFulfillment', 'Test Message.', 'testIntent'));
            });
        // Override the module-level mock to return French so translate_res doesn't exit early
        multilanguage.get_userLanguages.mockImplementationOnce(() =>
            Promise.resolve({ Languages: [{ LanguageCode: 'fr', Score: 1 }] })
        );
        const req = botRouterFixtures.createRequestObject('What is QnABot');
        req._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = true;
        const response = await specialtyBotRouter.routeRequest(req,
            botRouterFixtures.createResponseObject(), 'lexv2::test_bot', null);
        // get_translation should have been called to translate the response into French
        expect(multilanguage.get_translation).toHaveBeenCalled();
        expect(response.res).toBeDefined();
    });
});
