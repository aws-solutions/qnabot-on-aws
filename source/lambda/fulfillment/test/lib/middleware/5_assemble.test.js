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

describe('egress point sanitization of altMessages', () => {
    beforeEach(() => {
        process.env = {
            ...originalEnv,
        };
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should sanitize XSS from altMessages.html at egress', async () => {
        lex.assemble.mockReturnValue({});
        util.invokeLambda.mockReturnValue({});

        const req = assembleFixtures.createRequestObject("test", "LEX");
        const res = assembleFixtures.createMockResponse("PlainText");
        res.session = {
            qnabotcontext: {},
            appContext: {
                altMessages: {
                    html: '<img src=x onerror="alert(document.domain)"><p>Safe content</p>',
                    markdown: 'Safe markdown',
                }
            }
        };

        const result = await assemble(req, res);
        const appContext = JSON.parse(result.res.session.appContext);
        expect(appContext.altMessages.html).not.toContain('onerror');
        expect(appContext.altMessages.html).not.toContain('alert');
        expect(appContext.altMessages.html).toContain('<p>Safe content</p>');
    });

    test('should sanitize script tags from altMessages.html at egress', async () => {
        lex.assemble.mockReturnValue({});
        util.invokeLambda.mockReturnValue({});

        const req = assembleFixtures.createRequestObject("test", "LEX");
        const res = assembleFixtures.createMockResponse("PlainText");
        res.session = {
            qnabotcontext: {},
            appContext: {
                altMessages: {
                    html: '<p>Hello</p><script>steal(document.cookie)</script>',
                    markdown: 'Hello',
                }
            }
        };

        const result = await assemble(req, res);
        const appContext = JSON.parse(result.res.session.appContext);
        expect(appContext.altMessages.html).toBe('<p>Hello</p>');
    });

    test('should sanitize XSS from altMessages.markdown at egress', async () => {
        lex.assemble.mockReturnValue({});
        util.invokeLambda.mockReturnValue({});

        const req = assembleFixtures.createRequestObject("test", "LEX");
        const res = assembleFixtures.createMockResponse("PlainText");
        res.session = {
            qnabotcontext: {},
            appContext: {
                altMessages: {
                    html: '<p>Safe</p>',
                    markdown: '<img src=x onerror="alert(1)"><script>steal()</script>Some text',
                }
            }
        };

        const result = await assemble(req, res);
        const appContext = JSON.parse(result.res.session.appContext);
        expect(appContext.altMessages.markdown).not.toContain('onerror');
        expect(appContext.altMessages.markdown).not.toContain('<script>');
        expect(appContext.altMessages.markdown).toContain('Some text');
    });

    test('should not double-sanitize already safe HTML content', async () => {
        lex.assemble.mockReturnValue({});
        util.invokeLambda.mockReturnValue({});

        const req = assembleFixtures.createRequestObject("test", "LEX");
        const res = assembleFixtures.createMockResponse("PlainText");
        const safeHtml = '<p>Safe <b>content</b> with <a href="https://example.com">link</a></p>';
        res.session = {
            qnabotcontext: {},
            appContext: {
                altMessages: {
                    html: safeHtml,
                    markdown: '**Bold** and [link](https://example.com)',
                }
            }
        };

        const result = await assemble(req, res);
        const appContext = JSON.parse(result.res.session.appContext);
        expect(appContext.altMessages.html).toBe(safeHtml);
    });

    test('should not double-sanitize when sanitize is called multiple times', async () => {
        lex.assemble.mockReturnValue({});
        util.invokeLambda.mockReturnValue({});

        const req = assembleFixtures.createRequestObject("test", "LEX");
        const res = assembleFixtures.createMockResponse("PlainText");
        // Content that has already been sanitized once (e.g., by specialtyBotRouter)
        const preSanitizedHtml = '<h2>Heading</h2><p>Already <em>sanitized</em> content with <a href="https://example.com">link</a></p>';
        res.session = {
            qnabotcontext: {},
            appContext: {
                altMessages: {
                    html: preSanitizedHtml,
                    markdown: 'Already sanitized markdown',
                }
            }
        };

        const result = await assemble(req, res);
        const appContext = JSON.parse(result.res.session.appContext);
        // Running sanitize on already-sanitized content should produce identical output
        expect(appContext.altMessages.html).toBe(preSanitizedHtml);
        expect(appContext.altMessages.markdown).toBe('Already sanitized markdown');
    });

    test('should handle appContext as string (pre-serialized)', async () => {
        lex.assemble.mockReturnValue({});
        util.invokeLambda.mockReturnValue({});

        const req = assembleFixtures.createRequestObject("test", "LEX");
        const res = assembleFixtures.createMockResponse("PlainText");
        res.session = {
            qnabotcontext: {},
            appContext: JSON.stringify({
                altMessages: {
                    html: '<img src=x onerror="alert(1)"><p>Text</p>',
                    markdown: 'Safe',
                }
            })
        };

        const result = await assemble(req, res);
        const appContext = JSON.parse(result.res.session.appContext);
        expect(appContext.altMessages.html).not.toContain('onerror');
        expect(appContext.altMessages.html).toContain('<p>Text</p>');
    });
});
