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
const specialtyBotRouter = require('../../../lib/middleware/specialtyBotRouter');
const _ = require('lodash');
const botRouterFixtures = require('./specialtyBotRouter.fixtures')
const awsMock = require('aws-sdk-client-mock');
const { LexRuntimeService: LexRuntime } = require('@aws-sdk/client-lex-runtime-service')
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
        expect(response.res.message).toEqual("Welcome back to QnABot.");
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(response.res.session.appContext.altMessages).toEqual({ "html": "<i> Welcome back to QnABot. </i>" });
    });

    test('should return lambda response when target bot is lambda function', async () => {
        lambdaMock.on(InvokeCommand).resolves(botRouterFixtures.lambdaResponse);
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lambda::mockRoutingLambda", null);
        expect(response.res.message).toEqual("mockLambdaResponse");
    });

    test('should end use of Specialty Bot when target bot is lambda function & bot dialogState is Fulfilled', async () => {
        lambdaMock.on(InvokeCommand).resolves({
            "Payload": '{"message":"mockLambdaResponse", "dialogState": "Fulfilled",  "sessionAttributes":[]}'
        });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lambda::mockRoutingLambda", null);
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(response.res.message).toEqual("mockLambdaResponse");
        expect(response.res.session.appContext.altMessages).not.toBeDefined();
    });

});

describe('when calling routeRequest function with LexV1 as target', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('when using Lexv1 Bot & bot returns response with dialogState ReadyForFulfillment', async () => {
        let requestParams;
        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                requestParams = request;
                callback(null, botRouterFixtures.getLexV1Response("ReadyForFulfillment", "Test Message"));
            });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "test_bot", null);
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(JSON.parse(response.res.message)).toEqual({ "testSlot": { "shape": "Scalar", "value": { "originalValue": "Test Value" } } });
        expect(requestParams.sessionAttributes).toEqual({ "myAttribute": "test" });
    });

    test('should not call translate when ENABLE_MULTI_LANGUAGE_SUPPORT is disabled', async () => {
        let requestParams;
        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                requestParams = request;
                callback(null, botRouterFixtures.getLexV1Response("ReadyForFulfillment", "Test Message"));
            });
        const mockRequest = botRouterFixtures.createRequestObject("What is QnABot");
        mockRequest._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = false;
        const response = await specialtyBotRouter.routeRequest(mockRequest,
            botRouterFixtures.createResponseObject(), "test_bot", null);
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(JSON.parse(response.res.message)).toEqual({ "testSlot": { "shape": "Scalar", "value": { "originalValue": "Test Value" } } });
        expect(requestParams.sessionAttributes).toEqual({ "myAttribute": "test" });
        expect(translateSpy).toBeCalledTimes(0);
    });

    test('should translate if Native Language does not match', async () => {
        let requestParams;
        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                requestParams = request;
                callback(null, botRouterFixtures.getLexV1Response("ReadyForFulfillment", "Test Message"));
            });
        const mockRequest = botRouterFixtures.createRequestObject("Que es QnABot");
        mockRequest._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = true;
        mockRequest._settings.NATIVE_LANGUAGE = 'Spanish';
        const response = await specialtyBotRouter.routeRequest(mockRequest,
            botRouterFixtures.createResponseObject(), "test_bot", null);
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(JSON.parse(response.res.message)).toEqual({ "testSlot": { "shape": "Scalar", "value": { "originalValue": "Test Value" } } });
        expect(requestParams.sessionAttributes).toEqual({ "myAttribute": "test" });
        expect(translateSpy).toBeCalledTimes(3);
    });

    test('should translate if Native Language does not match with Speak tags', async () => {
        lambdaMock.on(InvokeCommand).resolves({
            "Payload": '{"message":"<speak>mockLambdaResponse</speak>", "dialogState": "Fulfilled",  "sessionAttributes":[]}'
        });
        const mockRequest = botRouterFixtures.createRequestObject("Que es QnABot");
        mockRequest._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = true;
        mockRequest._settings.NATIVE_LANGUAGE = 'Spanish';
        const response = await specialtyBotRouter.routeRequest(mockRequest,
            botRouterFixtures.createResponseObject(), "lambda::mockRoutingLambda", null);
        expect(response.res.session.qnabotcontext.specialtyBot).not.toBeDefined();
        expect(response.res.message).toEqual("<speak>mockLambdaResponse</speak>");
        expect(response.res.session.appContext.altMessages).not.toBeDefined();
    });

    test('should return error if LexV1 responds with Error', async () => {
        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                callback(new Error("Mock Error"), null);
            });
        await expect(specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "test_bot", null)).rejects.toEqual('Lex client request error:Error: Mock Error');
    });

    test('when routing to Lexv1 Bot and bot response has SSML, returned response should have ssml message', async () => {
        let requestParams;
        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                requestParams = request;
                const mockResponse = botRouterFixtures.getLexV1Response("", "Test Message");
                mockResponse.sessionAttributes.appContext = { "altMessages": { "ssml": "<speak>Test Message</speak>" } };
                callback(null, mockResponse);
            });
        let response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot", "SSML"),
            botRouterFixtures.createResponseObject(), "test_bot", null);
        expect(response.res.type).toEqual("SSML");
        expect(response.res.message).toEqual("<speak>Test Message</speak>");
        expect(requestParams.sessionAttributes).toEqual({ "myAttribute": "test" });


        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                requestParams = request;
                const mockResponse = botRouterFixtures.getLexV1Response("", "Test Message");
                mockResponse.sessionAttributes.appContext = '{ "altMessages": { "ssml": "<speak>Test Message</speak>"}}';
                callback(null, mockResponse);
            });
        response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot", "SSML"),
            botRouterFixtures.createResponseObject(), "test_bot", null);
        expect(response.res.type).toEqual("SSML");
        expect(response.res.message).toEqual("<speak>Test Message</speak>");
        expect(requestParams.sessionAttributes).toEqual({ "myAttribute": "test" });
    });


    test('when routing to Lexv1 Bot and bot resonse has SSML, returned response should have ssml message', async () => {
        let requestParams;
        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                requestParams = request;
                const mockResponse = botRouterFixtures.getLexV1Response("", "Test Message");
                mockResponse.sessionAttributes.appContext = { "altMessages": { "ssml": "<speak>Test Message</speak>" } };
                callback(null, mockResponse);
            });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot", "SSML"),
            botRouterFixtures.createResponseObject(), "test_bot", null);
        expect(response.res.type).toEqual("SSML");
        expect(response.res.message).toEqual("<speak>Test Message</speak>");
        expect(requestParams.sessionAttributes).toEqual({ "myAttribute": "test" });
    });

    test('when routing to Lexv1 Bot, returned response should have message type & message', async () => {
        jest.spyOn(LexRuntime.prototype, 'postText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV1Response("", "Test Message"));
            });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message");
    });
});


describe('when calling routeRequest function with LexV2 as target', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should return message returned by LexV2 bot response', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message", "testIntent"));
            });
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message");
    });

    test('should return message from bot response when LexV2 bot responds with intent name FallbackIntent or intent state Failed', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("", "Test Message", "FallbackIntent"));
            });
        let response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message");


        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, botRouterFixtures.getLexV2Response("Failed", "Test Message", "testIntent"));
            });
        response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            botRouterFixtures.createResponseObject(), "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message");
    });

    test('should return original response object, when using LexV2 & response messages contains only ImageResponseCard message', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                const mockResponse = botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message", "testIntent");
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
                const mockResponse = botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message", "testIntent");
                mockResponse.messages = [
                    {
                        "contentType": "ImageResponseCard",
                        "imageResponseCard": {}
                    },
                    {
                        "content": "Test Message",
                        "contentType": "PlainText"
                    }
                ]
                callback(null, mockResponse);
            });
        const mockResponseParam = botRouterFixtures.createResponseObject();
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponseParam, "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message");
        expect(response.res.result.r).toEqual({ "attachmentLinkUrl": "", "imageUrl": "", "send": true, "subTitle": "", "title": undefined });
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
                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message", "testIntent"));
            });
        const mockResponse = botRouterFixtures.createResponseObject();
        mockResponse.card = { "buttons": [{ "text": "test Button" }] };
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponse, "lexv2::test_bot", null);
        expect(response.res.type).toEqual("PlainText");
        expect(response.res.message).toEqual("Test Message");
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

                callback(null, botRouterFixtures.getLexV2Response("ReadyForFulfillment", "Test Message", "",
                    { "qnaslot": { "shape": "Scalar", "value": { "originalValue": "test value", "interpretedValue": "test value" } } }));
            });
        const mockResponse = botRouterFixtures.createResponseObject;
        const response = await specialtyBotRouter.routeRequest(botRouterFixtures.createRequestObject("What is QnABot"),
            mockResponse, "lexv2::test_bot", null);
        expect(response.res.message).toEqual("Test Message");
    });
});