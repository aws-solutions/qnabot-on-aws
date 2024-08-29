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
const lexRouter = require('../../../lib/middleware/lexRouter');
const _ = require('lodash');
const lexRouterFixtures = require('./lexRouter.fixtures')
const { LexRuntimeV2 } = require('@aws-sdk/client-lex-runtime-v2');
const multilanguage = require('../../../lib/middleware/multilanguage');
jest.mock('../../../lib/middleware/multilanguage');
jest.mock('@aws-sdk/client-lex-runtime-service');
jest.mock('@aws-sdk/client-lex-runtime-v2');

describe('when calling elicitResponse function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('verify response when hook name is QNAFreeText', async () => {
        multilanguage.get_translation.mockImplementation((message, res) => {
            return Promise.resolve(message);
        });

        multilanguage.get_userLanguages.mockImplementation((_) => {
            return Promise.resolve({Languages: [{
                "LanguageCode": "en",
                "Score": 1
            }]});
        });

        const response = await lexRouter.elicitResponse(lexRouterFixtures.createRequestObject("What is QnABot"),
            lexRouterFixtures.createResponseObject(), "QNAFreeText");
        expect(response.res.session.qnabot_gotanswer).toBe(true);
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.plainMessage).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
    });

    test('verify empty message is overriden by default value', async () => {

        const response = await lexRouter.elicitResponse(lexRouterFixtures.createRequestObject(""),
            lexRouterFixtures.createResponseObject(), "QNAFreeText");
        expect(response.res.session.qnabot_gotanswer).toBe(true);
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.plainMessage).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
    });

    test('verify response when LexV2 Bot responds with Fulfilled dialogState', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, lexRouterFixtures.getLexV2Response("Fulfilled", "Test Message", "testIntent"));
            });
        const response = await lexRouter.elicitResponse(lexRouterFixtures.createRequestObject("What is QnABot"),
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.session.qnabot_gotanswer).toBe(true);
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.plainMessage).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
    });

    test('Error from LexV2 request', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(new Error("Mock Error"), null);
            });
        await expect(lexRouter.elicitResponse(lexRouterFixtures.createRequestObject("What is QnABot"),
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName")).rejects.toEqual('Lex client request error:Error: Mock Error');
    });

    test('when LexV2 Bot responds with Failed dialogState', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, lexRouterFixtures.getLexV2Response("Fulfilled", "", "FallbackIntent"));
            });
        let response = await lexRouter.elicitResponse(lexRouterFixtures.createRequestObject("What is QnABot"),
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.session.qnabot_gotanswer).toBe(true);
        expect(response.res.message).toBe("Please try again.");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("ErrorHandling");

        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                callback(null, lexRouterFixtures.getLexV2Response("Fulfilled", "", "", "Failed"));
            });
        response = await lexRouter.elicitResponse(lexRouterFixtures.createRequestObject("What is QnABot"),
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.session.qnabot_gotanswer).toBe(true);
        expect(response.res.message).toBe("Please try again.");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("ErrorHandling");
    });

    test('when LexV2 Bot responds with Fulfilled dialogState & containing slots', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                const mockResponse = lexRouterFixtures.getLexV2Response("Fulfilled");
                mockResponse.sessionState.intent.slots = [{
                    "name": "mockSlot",
                    "priority": 1,
                }];
                callback(null, mockResponse);
            });
        const response = await lexRouter.elicitResponse(lexRouterFixtures.createRequestObject("What is QnABot"),
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.session.qnabot_gotanswer).toBe(true);
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.plainMessage).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(response.res.session.mockNamespace).toBeDefined();
    });

    test('when LexV2 Bot is passed in with a special Character User name for cognito', async () => {
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                const mockResponse = lexRouterFixtures.getLexV2Response("Fulfilled");
                mockResponse.sessionState.intent.slots = [{
                    "name": "mockSlot",
                    "priority": 1,
                }];
                callback(null, mockResponse);
            });
        const response = await lexRouter.elicitResponse(lexRouterFixtures.createRequestObjectWithSpecialCharacters("What is QnABot"),
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.session.qnabot_gotanswer).toBe(true);
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.plainMessage).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(response.res.session.mockNamespace).toBeDefined();
    });

    test('when LexV2 Bot responds with ConnectClientConfirmIntent request', async () => {
        let requestParamText = "";
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                requestParamText = request.text;
                callback(null, lexRouterFixtures.getLexV2Response("ConfirmIntent"));
            });
        const mockRequest = lexRouterFixtures.createRequestObject("1");
        mockRequest.session.qnabotcontext.elicitResponse = { "progress": "ConfirmIntent" };
        _.set(mockRequest, '_event.requestAttributes.x-amz-lex:accept-content-types', 'SSML');
        let response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("ConfirmIntent");
        expect(requestParamText).toEqual("Yes");

        mockRequest.question = "one";
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("ConfirmIntent");

        mockRequest.question = "correct";
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("ConfirmIntent");
        expect(requestParamText).toEqual("Yes");

        mockRequest.question = "2";
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("ConfirmIntent");
        expect(requestParamText).toEqual("No");

        mockRequest.question = "two";
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "lexv2::mockBotName");
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("ConfirmIntent");
        expect(requestParamText).toEqual("No");
    });

    test('when LexV2 Bot request contains Phone number', async () => {
        let requestParamText = "";
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                requestParamText = request.text;
                callback(null, lexRouterFixtures.getLexV2Response("Fulfilled"));
            });
        const mockRequest = lexRouterFixtures.createRequestObject("1111111");
        mockRequest.session.qnabotcontext.elicitResponse = { "progress": "ElicitSlot" };
        process.env.QNAPhoneNumber = "lexv2::QNAPhoneNumber";
        _.set(mockRequest, '_event.requestAttributes.x-amz-lex:accept-content-types', 'SSML');
        let response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNAPhoneNumber");
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("my number is 1111111");

        process.env.QNAPhoneNumberNoConfirm = "lexv2::QNAPhoneNumberNoConfirm";
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNAPhoneNumberNoConfirm");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("my number is 1111111");

        mockRequest.session.qnabotcontext.elicitResponse = { "progress": "ElicitIntent" };
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNAPhoneNumberNoConfirm");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("my number is 1111111");

        mockRequest.session.qnabotcontext.elicitResponse = { "progress": "" };
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNAPhoneNumberNoConfirm");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("my number is 1111111");
    });

    test('when LexV2 Bot request contains Date', async () => {
        let requestParamText = "";
        jest.spyOn(LexRuntimeV2.prototype, 'recognizeText')
            .mockImplementation((request, callback) => {
                requestParamText = request.text;
                callback(null, lexRouterFixtures.getLexV2Response("Fulfilled"));
            });
        const mockRequest = lexRouterFixtures.createRequestObject("12-01-2023");
        mockRequest.session.qnabotcontext.elicitResponse = { "progress": "ElicitSlot" };
        process.env.QNADateNoConfirm = "lexv2::QNADateNoConfirm";
        _.set(mockRequest, '_event.requestAttributes.x-amz-lex:accept-content-types', 'SSML');
        let response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNADateNoConfirm");
        expect(response.res.message).toBe("Ok. ");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("the date is 12-01-2023");

        process.env.QNADate = "lexv2::QNADate";
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNADate");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("the date is 12-01-2023");

        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNADate");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("the date is 12-01-2023");


        mockRequest.session.qnabotcontext.elicitResponse = { "progress": "ElicitIntent" };
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNADate");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("the date is 12-01-2023");

        mockRequest.session.qnabotcontext.elicitResponse = { "progress": "" };
        response = await lexRouter.elicitResponse(mockRequest,
            lexRouterFixtures.createResponseObject(), "QNADate");
        expect(response.res.session.qnabotcontext.elicitResponse.progress).toBe("Fulfilled");
        expect(requestParamText).toEqual("the date is 12-01-2023");
    });

});