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

const alexa = require('../../../lib/middleware/alexa');
const alexaFixtures = require('./alexa.fixtures')
const {get_translation} = require('../../../lib/middleware/multilanguage');
jest.mock('../../../lib/middleware/multilanguage');

describe('when calling parse function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('when calling with request type LaunchRequest', async () => {
        get_translation.mockReturnValue("Hello, Please ask a question");
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"))).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "Hello, Please ask a question", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "Hello, Please ask a question", "type": "PlainText" },
                        "shouldEndSession": false
                    }, "version": "1.0"
                }
            });
    });

    test('when calling with request type LaunchRequest', async () => {
        get_translation.mockReturnValue("Hello, Please ask a question");
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"))).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "Hello, Please ask a question", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "Hello, Please ask a question", "type": "PlainText" },
                        "shouldEndSession": false
                    }, "version": "1.0"
                }
            });
    });

    test('when calling with request type LaunchRequest & multi language disabled', async () => {
        const mockRequest = alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest");
        mockRequest._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = false;
        await expect(alexa.parse(mockRequest)).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "Hello, Please ask a question", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "Hello, Please ask a question", "type": "PlainText" },
                        "shouldEndSession": false
                    }, "version": "1.0"
                }
            });
        expect(get_translation).not.toHaveBeenCalled();
    });

    test('when calling with request type SessionEndedRequest', async () => {
        get_translation.mockReturnValue("Hello, Please ask a question");
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "SessionEndedRequest"))).
            rejects.toEqual({
                "action": "END",
            });
    });

    test('when calling with request type IntentRequest & intent as CancelIntent', async () => {
        get_translation.mockReturnValue("Goodbye");
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "AMAZON.CancelIntent"))).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "Goodbye", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "Goodbye", "type": "PlainText" },
                        "shouldEndSession": true
                    }, "version": "1.0"
                }
            });
    });

    test('when calling with request type IntentRequest, intent as CancelIntent & multi language disabled', async () => {
        const mockRequest = alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "AMAZON.CancelIntent");
        mockRequest._settings.ENABLE_MULTI_LANGUAGE_SUPPORT = false;
        await expect(alexa.parse(mockRequest)).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "Goodbye", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "Goodbye", "type": "PlainText" },
                        "shouldEndSession": true
                    }, "version": "1.0"
                }
            });
        expect(get_translation).not.toHaveBeenCalled();
    });

    test('when calling with request type IntentRequest & intent as StopIntent', async () => {
        get_translation.mockReturnValue("Goodbye");
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "AMAZON.StopIntent"))).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "Goodbye", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "Goodbye", "type": "PlainText" },
                        "shouldEndSession": true
                    }, "version": "1.0"
                }
            });
    });

    test('when calling with request type IntentRequest & intent as FallbackIntent', async () => {
        get_translation.mockReturnValue("Sorry, I do not understand. Please try again.")
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "AMAZON.FallbackIntent"))).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "Sorry, I do not understand. Please try again.", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "Sorry, I do not understand. Please try again.", "type": "PlainText" },
                        "shouldEndSession": false
                    }, "version": "1.0"
                }
            });
    });

    test('when calling with request type IntentRequest & intent as RepeatIntent', async () => {
        get_translation.mockReturnValue("Hello, Please ask a question");
        const mockRequest = alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "AMAZON.RepeatIntent");

        await expect(alexa.parse(mockRequest)).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "outputSpeech": { "text": "Hello, Please ask a question", "type": "PlainText" },
                        "shouldEndSession": false
                    }, "version": "1.0"
                }
            });
        mockRequest._event.session.attributes.cachedOutput = {
            "outputSpeech":
                { "type": 'PlainText', "text": "Mock message" }, "shouldEndSession": false
        };
        await expect(alexa.parse(mockRequest)).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "outputSpeech": { "text": "Mock message", "type": "PlainText" },
                        "shouldEndSession": false
                    }, "version": "1.0"
                }
            });
    });

    test('when calling with request type IntentRequest & Unhandled intent', async () => {
        get_translation.mockReturnValue("The skill is unable to process the request.");
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "MockIntent"))).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "The skill is unable to process the request.", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "The skill is unable to process the request.", "type": "PlainText" },
                        "shouldEndSession": true
                    }, "version": "1.0"
                }
            });
    });

    test('when calling with request type IntentRequest & Qna_intent intent with no value for QnA_slot slots.QnA_slot.value', async () => {
        get_translation.mockReturnValue("The skill is unable to process the request.");
        await expect(alexa.parse(alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "Qna_intent"))).
            rejects.toEqual({
                "action": "RESPOND",
                "message":
                {
                    "response": {
                        "card": { "content": "The skill is unable to process the request.", "title": "Message", "type": "Simple" },
                        "outputSpeech": { "text": "The skill is unable to process the request.", "type": "PlainText" },
                        "shouldEndSession": true
                    }, "version": "1.0"
                }
            });
    });

    test('should return response when calling with request type IntentRequest & Qna_intent intent', async () => {
        get_translation.mockReturnValue("The skill is unable to process the request.");
        const request = alexaFixtures.createRequestObject("What is QnABot", "IntentRequest", "Qna_intent");
        request._event.request.intent.slots = { "QnA_slot": { "value": "mock_value" } };
        await expect(alexa.parse(request)).
            resolves.toEqual({
                "_type": "ALEXA", "_userId": "mockUserId",
                "original": {
                    "session": {
                        "attributes": { "idtokenjwt": "mock_id_token" },
                        "user": { "userId": "mockUserId" }
                    },
                    "request": {
                        "locale": "en-US",
                        "type": "IntentRequest",
                        "intent": { "name": "Qna_intent", "slots": { "QnA_slot": { "value": "mock_value" } } }
                    }
                },
                "session": {
                    "idtokenjwt": "mock_id_token",
                    "qnabotcontext": { "userPreferredLocale": "en" }
                },
                "channel": null,
                "question": "mock_value"
            });
    });
});

describe('when calling assemble function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should remove <speak> tags if response message includes <speak> tag', () => {
        const response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            alexaFixtures.createResponseObject("<speak>What is QnABot</speak>", "PlainText", "mock_subtitle",));
        expect(response).toEqual({
            "version": "1.0", "response": {
                "outputSpeech": { "type": "PlainText", "text": "<speak>What is QnABot</speak>" },
                "card": { "type": "Simple", "title": "What is QnABot", "content": "mock_subtitle\n\nWhat is QnABot" }, "shouldEndSession": false
            }, "sessionAttributes": {}
        });
    });

    test('when calling with empty response message', () => {
        const response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            alexaFixtures.createResponseObject("", "PlainText"));
        expect(response.response.card.content).toEqual("");
    });

    test('should remove ok from response if response message starts with ok', () => {
        let response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            alexaFixtures.createResponseObject("ok. What is QnABot", "PlainText", "mock_subtitle"));

        expect(response).toEqual({
            "version": "1.0", "response": {
                "outputSpeech": { "type": "PlainText", "text": "ok. What is QnABot" },
                "card": { "type": "Simple", "title": "What is QnABot", "content": "mock_subtitle\n\nWhat is QnABot" },
                "shouldEndSession": false
            }, "sessionAttributes": {}
        });
        response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            alexaFixtures.createResponseObject("ok. QnABot is chatbot", "PlainText"));

        expect(response.response.card.title).toEqual("What is QnABot");
        expect(response.response.card.content).toEqual("QnABot is chatbot");
        expect(response.response.card.type).toEqual("Simple");
    });



    test('when response contains imageUrl', () => {
        const mockResponse = alexaFixtures.createResponseObject("QnABot is chatbot", "PlainText", null, "mock_image_url");
        let response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            mockResponse);

        expect(response.response).toEqual({
            "outputSpeech": { "type": "PlainText", "text": "QnABot is chatbot" }, "card": {
                "type": "Standard", "title": "What is QnABot",
                "text": "QnABot is chatbot", "image": { "smallImageUrl": "mock_image_url", "largeImageUrl": "mock_image_url" }
            }, "shouldEndSession": false
        });

        mockResponse.card.title = "What is QnABot?";
        mockResponse.card.subTitle = "mock_subtitle";

        response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"), mockResponse);
        expect(response.response).toEqual({
            "outputSpeech": { "type": "PlainText", "text": "QnABot is chatbot" }, "card": {
                "type": "Standard", "title": "What is QnABot?",
                "text": "mock_subtitle\n\nQnABot is chatbot", "image": { "smallImageUrl": "mock_image_url", "largeImageUrl": "mock_image_url" }
            }, "shouldEndSession": false
        });
    });

    test('when response type is SSML', () => {
        let response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            alexaFixtures.createResponseObject("QnABot is chatbot", "SSML", "", ""));

        expect(response.response.outputSpeech).toEqual({ "type": "SSML", "ssml": "QnABot is chatbot" });
    });

    test('when response contains reprompt.text', () => {
        const mockResponseObject = alexaFixtures.createResponseObject("QnABot is chatbot", "PlainText");
        mockResponseObject.reprompt = { "text": "mock_reprompt_text", "type": "PlainText" };
        let response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            mockResponseObject);

        expect(response.response.reprompt).toEqual({ "outputSpeech": { "type": "PlainText", "text": "mock_reprompt_text", "playBehavior": "REPLACE_ENQUEUED" } });
        mockResponseObject.reprompt = { "text": "mock_reprompt_text", "type": "SSML" };
        response = alexa.assemble(alexaFixtures.createRequestObject("What is QnABot", "LaunchRequest"),
            mockResponseObject);
        expect(response.response.reprompt).toEqual({ "outputSpeech": { "type": "SSML", "ssml": "mock_reprompt_text", "playBehavior": "REPLACE_ENQUEUED" } });
    });

});