/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const assemble = require('../../../lib/middleware/5_assemble');
const assembleFixtures = require('./5_assemble.fixtures')
const originalEnv = process.env;
const lex = require('../../../lib/middleware/lex');
const alexa = require('../../../lib/middleware/alexa');
const util = require('../../../lib/middleware/util');
const translate = require('../../../lib/middleware/multilanguage');
jest.mock('../../../lib/middleware/util');
jest.mock('../../../lib/middleware/jwt');
jest.mock('../../../lib/middleware/lex');
jest.mock('../../../lib/middleware/alexa');
jest.mock('../../../lib/middleware/multilanguage');

describe('when calling assemble function', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
            'LAMBDA_LOG': 'mock_lambda_log',
            'LAMBDA_RESPONSE': 'mock_response_lambda'
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('when calling using assemble with LEX request type', async () => {
        util.invokeLambda.mockReturnValue(assembleFixtures.createMockResponse("PlainText"));
        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);

        const assembled = await assemble(assembleFixtures.createRequestObject("What is QnABot", "LEX"),
            assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.out).toEqual(assembleFixtures.mockAssembleOutput);
        expect(util.invokeLambda).toHaveBeenCalledTimes(2);
    });

    test('when calling using assemble with ALEXA request type', async () => {
        util.invokeLambda.mockReturnValue(assembleFixtures.createMockResponse("PlainText"));
        alexa.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);
        const assembled = await assemble(assembleFixtures.createRequestObject("What is QnABot", "ALEXA"),
            assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.out).toEqual(assembleFixtures.mockAssembleOutput);
        expect(util.invokeLambda).toHaveBeenCalledTimes(2);
    });

    test('should not return anything when error occurs', async () => {
        process.env = {
            ...originalEnv,
            'LAMBDA_LOG': 'mock_lambda_log'
        };
        util.invokeLambda.mockImplementation(() => {
            throw new Error('Mock Lambda Invoke error');
        });
        expect(assemble(assembleFixtures.createRequestObject("What is QnABot", "LEX"),
            assembleFixtures.createMockResponse("PlainText"))).rejects.toThrowError('Mock Lambda Invoke error');
    });

    test('should receive sms hint in response if sms hint is enabled', async () => {
        util.invokeLambda.mockReturnValue(assembleFixtures.createMockResponse("PlainText"));
        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);
        const request = assembleFixtures.createRequestObject("What is QnABot", "LEX", true)
        let assembled = await assemble(request, assembleFixtures, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.message).toEqual("QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback");

        request._settings.SMS_HINT_REMINDER_ENABLE = false;
        assembled = await assemble(request, assembleFixtures, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.message).toEqual("QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback");

        request._settings.SMS_HINT_REMINDER_ENABLE = true;
        request._settings.SMS_HINT_REMINDER_INTERVAL_HRS = 1;
        request._userInfo.TimeSinceLastInteraction = 3700000;
        assembled = await assemble(request, assembleFixtures, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.message).toEqual("QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback(Feedback? Reply THUMBS UP or THUMBS DOWN. Ask HELP ME at any time)");

    });

    test('should translate NextPrompt into target language if QnABot is in multi language mode', async () => {
        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);

        const request = assembleFixtures.createRequestObject("What is QnABot", "LEX", true)
        request.session.qnabotcontext.userLocale = "es";
        const mockResponse = assembleFixtures.createMockResponse();
        mockResponse.session.connect_nextPrompt = "Hello"
        util.invokeLambda.mockReturnValue(mockResponse);

        translate.get_translation.mockReturnValue("Hola")

        const assembled = await assemble(request, assembleFixtures.createMockResponse("PlainText"));
        expect(translate.get_translation).toHaveBeenCalled();
        expect(assembled.res.session.connect_nextPrompt).toEqual("Hola");
        expect(util.invokeLambda).toHaveBeenCalledTimes(2);

    });

    test('If in elicit response, should set next prompt to empty', async () => {
        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);

        const request = assembleFixtures.createRequestObject("What is QnABot", "LEX", true)
        request._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = false;

        const mockResponse = assembleFixtures.createMockResponse();
        mockResponse.session.connect_nextPrompt = "Hello"
        mockResponse.session.qnabotcontext.elicitResponse = { "responsebot": "mock_elicit_response" };
        util.invokeLambda.mockReturnValue(mockResponse);

        translate.get_translation.mockReturnValue("Hola")

        const assembled = await assemble(request, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.session.connect_nextPrompt).toEqual("");
        expect(util.invokeLambda).toHaveBeenCalledTimes(2);

    });

    test('when using connect Voice', async () => {
        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);

        const request = assembleFixtures.createRequestObject("What is QnABot", "LEX", true)
        request._clientType = "LEX.AmazonConnect.Voice"
        const mockResponse = assembleFixtures.createMockResponse("PlainText");
        util.invokeLambda.mockReturnValue(mockResponse);

        //If session.qnabotcontext.elicitResponse.responsebot is empty, nextPromt in response should be set to empty
        let assembled = await assemble(request, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.session.connect_nextPrompt).toEqual("");

        mockResponse.session.connect_nextPrompt = "Hello"
        translate.get_translation.mockReturnValue("Hello")
        util.invokeLambda.mockReturnValue(mockResponse);
        //IF CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT is false
        assembled = await assemble(request, assembleFixtures.mockResponse);
        expect(assembled.res.session.connect_nextPrompt).toEqual("Hello");

        mockResponse.session.qnabotcontext.elicitResponse = { "responsebot": "mock_elicit_response" };
        util.invokeLambda.mockReturnValue(mockResponse);
        await assemble(request, assembleFixtures.mockResponse);
        expect(assembled.res.session.connect_nextPrompt).toEqual("");
    });


    test('when using connect Voice PlainText response type', async () => {
        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);

        const request = assembleFixtures.createRequestObject("What is QnABot", "LEX", true)
        request._clientType = "LEX.AmazonConnect.Voice"
        request._settings.CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT = true;
        const mockResponse = assembleFixtures.createMockResponse("PlainText");

        mockResponse.session.connect_nextPrompt = "<speak>Mock Prompt</speak>";
        translate.get_translation.mockReturnValue("<speak>Mock Prompt</speak>")

        util.invokeLambda.mockReturnValue(mockResponse);

        let assembled = await assemble(request, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.message).toEqual("QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback");
        expect(assembled.res.session.connect_nextPrompt).toEqual(" Mock Prompt");

        mockResponse.message = "QnABot on AWS is a chatbot. QnaBot responds to your customer's questions, answers, and feedback";
        util.invokeLambda.mockReturnValue(mockResponse);

        assembled = await assemble(request, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.message).toEqual("QnABot on AWS is a chatbot");
        expect(assembled.res.session.connect_nextPrompt).toEqual(" QnaBot responds to your customer's questions, answers, and feedback Mock Prompt");
    });


    test('when using connect Voice SSML response type', async () => {
        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);

        const request = assembleFixtures.createRequestObject("What is QnABot", "LEX", true)
        request._clientType = "LEX.AmazonConnect.Voice"
        request._settings.CONNECT_ENABLE_VOICE_RESPONSE_INTERRUPT = true;
        const mockResponse = assembleFixtures.createMockResponse("SSML");

        mockResponse.session.connect_nextPrompt = "<speak>Mock Prompt</speak>";
        translate.get_translation.mockReturnValue("<speak>Mock Prompt</speak>")

        util.invokeLambda.mockReturnValue(mockResponse);

        let assembled = await assemble(request, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.session.connect_nextPrompt).toEqual("<speak> Mock Prompt</speak>");
        expect(assembled.res.message).toEqual("<speak>QnABot on AWS is a multi-channel, multi-language conversational interface (chatbot) that responds to your customer's questions, answers, and feedback</speak>");

        mockResponse.message = "QnABot on AWS is a chatbot. QnaBot responds to your customer's questions, answers, and feedback";
        util.invokeLambda.mockReturnValue(mockResponse);

        assembled = await assemble(request, assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.message).toEqual("<speak>QnABot on AWS is a chatbot</speak>");
        expect(assembled.res.session.connect_nextPrompt).toEqual("<speak> QnaBot responds to your customer's questions, answers, and feedback Mock Prompt</speak>");
    });


    test('verify resetAttributes when calling assemble', async () => {
        process.env = {
            ...originalEnv,
            'LAMBDA_LOG': 'mock_lambda_log',
        };

        lex.assemble.mockReturnValue(assembleFixtures.mockAssembleOutput);
        const mockResponse = assembleFixtures.createMockResponse("PlainText");
        util.invokeLambda.mockReturnValue(assembleFixtures.createMockResponse("PlainText"));

        let assembled = await assemble(assembleFixtures.createRequestObject("What is QnABot", "LEX"), assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.out).toEqual(assembleFixtures.mockAssembleOutput);
        expect(util.invokeLambda).toHaveBeenCalledTimes(1);

        mockResponse.result = {};
        util.invokeLambda.mockReturnValue(assembleFixtures.createMockResponse("PlainText"));
        assembled = await assemble(assembleFixtures.createRequestObject("What is QnABot", "LEX"), assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.out).toEqual(assembleFixtures.mockAssembleOutput);

        mockResponse.session.qnabotcontext.kendra = {
            "kendraResponsibleQid": "mock_qid",
            "kendraQueryId": "mock_query_id",
            "kendraIndexId": "mock_index_id",
            "kendraResultId": "mock_result_id",
        };
        assembled = await assemble(assembleFixtures.createRequestObject("What is QnABot", "LEX"), assembleFixtures.createMockResponse("PlainText"));
        expect(assembled.res.session.qnabotcontext.kendra).not.toBeDefined();
    });
});
