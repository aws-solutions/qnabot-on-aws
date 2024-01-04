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

const lex = require('../../../lib/middleware/lex');
const lexFixtures = require('./lex.fixtures')

describe('when calling parse function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should throw error if inputTranscript is undefined or empty', async () => {
        expect(lex.parse(lexFixtures.createRequestObject(undefined, "LEX.AmazonConnect.Text", "V2"))).
            rejects.toThrowError("Error - inputTranscript string is empty.");

        expect(lex.parse(lexFixtures.createRequestObject("", "LEX.AmazonConnect.Text", "V2"))).
            rejects.toThrowError("Error - inputTranscript string is empty.");
    });

    test('should throw error if request is connect request & inputTranscript contains only words specified in setting CONNECT_IGNORE_WORDS', async () => {
        const mockRequest = lexFixtures.createRequestObject("MockIgnore1 MockIgnore2", "LEX.AmazonConnect.Text", "V1");
        mockRequest._settings.CONNECT_IGNORE_WORDS = "MockIgnore1,MockIgnore2"
        expect(lex.parse(mockRequest)).
            rejects.toThrowError('Error - inputTranscript contains only words specified in setting CONNECT_IGNORE_WORDS: "MockIgnore1 MockIgnore2"');

        mockRequest._clientType = "LEX.AmazonConnect.Voice"
        expect(lex.parse(mockRequest)).
            rejects.toThrowError('Error - inputTranscript contains only words specified in setting CONNECT_IGNORE_WORDS: "MockIgnore1 MockIgnore2"');
    });

    test('should able to parse Lexv1 request successfully', async () => {
        let parsedRequest = await lex.parse(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text"));
        expect(parsedRequest.question).toEqual("What is QnABot");
        expect(parsedRequest._lexVersion).toEqual("V1");
        expect(parsedRequest._userId).toEqual("mock_user_id");
        expect(parsedRequest.intentname).toEqual("mockIntent");

        //Request containing some ignore words
        const mockRequest = lexFixtures.createRequestObject("MockIgnore1 MockIgnore2", "LEX.AmazonConnect.Text", "V1");
        mockRequest._settings.CONNECT_IGNORE_WORDS = "MockIgnore1"
        parsedRequest = await lex.parse(mockRequest);
        expect(parsedRequest.question).toEqual("MockIgnore1 MockIgnore2");
        expect(parsedRequest._lexVersion).toEqual("V1");
    });

    test('should able to parse Lexv1 request with sessionAttributes successfully', async () => {
        let parsedRequest = await lex.parse(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V1"));
        expect(parsedRequest.question).toEqual("What is QnABot");
        expect(parsedRequest._lexVersion).toEqual("V1");
        expect(parsedRequest._userId).toEqual("mock_user_id");
        expect(parsedRequest.intentname).toEqual("mockIntent");

        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V1");
        mockRequest._event.sessionAttributes = { "mockField": "{\"key1\": \"val1\" }" };
        parsedRequest = await lex.parse(mockRequest);
        expect(parsedRequest.question).toEqual("What is QnABot");
        expect(parsedRequest._lexVersion).toEqual("V1");
        expect(parsedRequest.session).toEqual({ "mockField": { "key1": "val1" } });
    });

    test('should able to parse Lexv2 request successfully', async () => {
        let parsedRequest = await lex.parse(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2"));
        expect(parsedRequest.question).toEqual("What is QnABot");
        expect(parsedRequest._lexVersion).toEqual("V2");
        expect(parsedRequest._userId).toEqual("mockSessionId");
        expect(parsedRequest.qid).toEqual("mockIntent");

        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2");
        mockRequest._event.sessionState.sessionAttributes = { "mockField": "{\"key1\": \"val1\" }" }
        parsedRequest = await lex.parse(mockRequest);
        mockRequest._event.sessionState.intent
        expect(parsedRequest).toEqual({
            "_type": "LEX", "_lexVersion": "V2",
            "_userId": "mockSessionId", "invocationSource": "FulfillmentCodeHook",
            "intentname": "mockIntent", "slots": {}, "question": "What is QnABot",
            "session": { "mockField": { "key1": "val1" } }, "qid": "mockIntent"
        });
    });

    test('should able to parse Lexv2 request with custom intent successfully', async () => {
        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2");
        mockRequest._event.sessionState.intent = {
            "name": "QID-INTENT-testIntent",
            "slots": {
                "qnaslot": {
                    "shape": "Scalar",
                    "value": {
                        "originalValue": "Test value",
                        "resolvedValues": [],
                        "interpretedValue": "Test value"
                    }
                }
            }
        };
        mockRequest._event.sessionState.sessionAttributes = { "mockField": "{\"key1\": \"val1\" }" }
        const parsedRequest = await lex.parse(mockRequest);
        expect(parsedRequest).toEqual({
            "_type": "LEX", "_lexVersion": "V2",
            "_userId": "mockSessionId", "invocationSource": "FulfillmentCodeHook",
            "intentname": "QID-INTENT-testIntent", "slots": { "qnaslot": "Test value" }, "question": "What is QnABot",
            "session": { "mockField": { "key1": "val1" } }, "qid": "testIntent"
        });
    });

    test('should able to parse Lexv2 request with inputMode Speech', async () => {
        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2");
        mockRequest._event.inputMode = "Speech";
        const parsedRequest = await lex.parse(mockRequest);;
        expect(parsedRequest.question).toEqual("What is QnABot");
        expect(parsedRequest._lexVersion).toEqual("V2");
        expect(parsedRequest.session.qnabotcontext.userPreferredLocale).toEqual("en");
    });

});

describe('when calling assemble function', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // LexV1 Tests
    test('should be able to assemble Lexv1 response successfully', () => {
        const assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V1"),
            lexFixtures.createResponseObject());
        expect(assembledResponse.dialogAction.type).toEqual("Close");
        expect(assembledResponse.dialogAction.fulfillmentState).toEqual("Fulfilled");
        expect(assembledResponse.dialogAction.message.content).toEqual("The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.");

    });

    test('should be able to assemble Lexv1 with _clientType as LEX.Slack.Text', () => {
        let assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.Slack.Text", "V1"),
            lexFixtures.createResponseObject());
        expect(assembledResponse.dialogAction.type).toEqual("Close");
        expect(assembledResponse.dialogAction.fulfillmentState).toEqual("Fulfilled");
        expect(assembledResponse.dialogAction.message.content).toEqual("*QnaBot*\n\nThe Q and A Bot uses <https://aws.amazon.com/lex|Amazon Lex> and <https://developer.amazon.com/alexa|Alexa> to provide a natural language interface for your FAQ knowledge base. Now your users can just ask a ​_question_​ and get a quick and relevant ​_answer_​.\n");

        //with no markdown text
        const mockResponse = lexFixtures.createResponseObject();
        mockResponse.result.alt.markdown = "";
        assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.Slack.Text", "V1"),
            mockResponse);
        expect(assembledResponse.dialogAction.message.content).toEqual("The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.");
    });


    test('LexV1 verify copyResponseCardtoSessionAttribute', () => {
        const mockResponse = lexFixtures.createResponseObject(true);
        mockResponse.card.buttons = [{ "text": "mockText", "value": "mockValue" }, { "text": "", "value": "" }];
        const assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V1"),
            mockResponse);
        expect(assembledResponse.dialogAction.fulfillmentState).toEqual("Fulfilled");
        expect(assembledResponse.dialogAction.message.content).toEqual("The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.");
        expect(assembledResponse.dialogAction.responseCard).toEqual({
            "version": "1",
            "contentType": "application/vnd.amazonaws.card.generic",
            "genericAttachments": [
                {
                    "title": "mock_title", "buttons": [{ "text": "mockText", "value": "mockValue" }]
                }
            ]
        });
    });

    test('verify LexV1 buildV1InteractiveMessageResponse', () => {
        const assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.AmazonConnect.Text", "V1", "testIntent"),
            lexFixtures.createResponseObject(true));
        expect(assembledResponse.dialogAction.type).toEqual("ElicitSlot");
        expect(assembledResponse.dialogAction.intentName).toEqual("testIntent");
        expect(assembledResponse.dialogAction.message.content).toEqual('{\"templateType\":\"ListPicker\",\"version\":\"1.0\",\"data\":{\"content\":{\"title\":\"The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.\",\"elements\":[{\"title\":\"mockText\"}],\"subtitle\":\"mock_title\"}}}');
    });

    test('verify LexV1 elicit Response', () => {
        let mockResponse = lexFixtures.createResponseObject();
        mockResponse.session.qnabotcontext = "{\"elicitResponse\": {\"responsebot\": \"mock_response_bot\", \"responsetext\": \"mock_response_text\"}}"
        let assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V1", "testIntent"),
            mockResponse);
        expect(assembledResponse.dialogAction.type).toEqual("ElicitSlot");
        expect(assembledResponse.dialogAction.intentName).toEqual("testIntent");
        expect(assembledResponse.dialogAction.message.content).toEqual('The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.');

        mockResponse.session.qnabotcontext = "{\"specialtyBot\": \"testBot\"}"
        assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V1", "testIntent"),
            mockResponse);
        expect(assembledResponse.dialogAction.type).toEqual("ElicitSlot");
        expect(assembledResponse.dialogAction.intentName).toEqual("testIntent");
        expect(assembledResponse.dialogAction.message.content).toEqual('The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.');
    });

    // LexV2 Tests
    test('should be able to assemble Lexv2 response successfully', () => {
        const assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2"),
            lexFixtures.createResponseObject());
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("Close");
        expect(assembledResponse.sessionState.intent.state).toEqual("Fulfilled");
        expect(assembledResponse.messages[0].content).toEqual("The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.");

    });

    test('should truncate button list to contain only first 5 buttons if button list size is more than 5', () => {
        const mockResponse = lexFixtures.createResponseObject(true);
        mockResponse.card.buttons = [{ "text": "text1", "value": "value1" },
        { "text": "text2", "value": "value2" },
        { "text": "text3", "value": "value3" },
        { "text": "text4", "value": "value4" },
        { "text": "text5", "value": "value5" },
        { "text": "text6", "value": "value6" }];
        const assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2"), mockResponse);

        console.log(`assembledResponse3 ${assembledResponse}`);
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("Close");
        expect(assembledResponse.sessionState.intent.state).toEqual("Fulfilled");
        expect(assembledResponse.messages[0].content).toEqual("The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.");
        expect(assembledResponse.messages[1].imageResponseCard.buttons.length).toEqual(5);
    });

    test('verify LexV2 InteractiveMessageResponse ', () => {
        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.AmazonConnect.Text", "V2", "testIntent");
        let assembledResponse = lex.assemble(mockRequest,
            lexFixtures.createResponseObject(true));
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("ElicitIntent");
        expect(assembledResponse.messages[0].contentType).toEqual("CustomPayload");
        expect(assembledResponse.messages[0].content).toEqual('{\"templateType\":\"ListPicker\",\"version\":\"1.0\",\"data\":{\"content\":{\"title\":\"The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.\",\"elements\":[{\"title\":\"mockText\"}],\"subtitle\":\"mock_title\"}}}');


        //with invalid image url
        const mockResponse = lexFixtures.createResponseObject(true);
        mockResponse.card.imageUrl = "mock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddff";
        assembledResponse = lex.assemble(mockRequest, mockResponse);
        expect(assembledResponse.messages[0].content).toEqual('{\"templateType\":\"ListPicker\",\"version\":\"1.0\",\"data\":{\"content\":{\"title\":\"The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.\",\"elements\":[{\"title\":\"mockText\"}],\"subtitle\":\"mock_title\"}}}');

        //with valid image url
        mockResponse.card.imageUrl = "mock_url";
        assembledResponse = lex.assemble(mockRequest, mockResponse);

        expect(assembledResponse.messages[0].content).toEqual("{\"templateType\":\"ListPicker\",\"version\":\"1.0\",\"data\":{\"content\":{\"title\":\"The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.\",\"elements\":[{\"title\":\"mockText\"}],\"subtitle\":\"mock_title\",\"imageType\":\"URL\",\"imageData\":\"mock_url\"}}}");
    });


    test('should truncate button list to 6 buttons for Interactive Message', () => {
        const mockResponse = lexFixtures.createResponseObject(true);
        mockResponse.card.buttons = [{ "text": "text1", "value": "value1" },
        { "text": "text2", "value": "value2" },
        { "text": "text3", "value": "value3" },
        { "text": "text4", "value": "value4" },
        { "text": "text5", "value": "value5" },
        { "text": "text6", "value": "value6" },
        { "text": "text7", "value": "value7" }];
        const assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.AmazonConnect.Text", "V2", "testIntent"),
            mockResponse);
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("ElicitIntent");
        expect(assembledResponse.messages[0].contentType).toEqual("CustomPayload");
        expect(assembledResponse.messages[0].content).toEqual('{\"templateType\":\"ListPicker\",\"version\":\"1.0\",\"data\":{\"content\":{\"title\":\"The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.\",\"elements\":[{\"title\":\"text1\"},{\"title\":\"text2\"},{\"title\":\"text3\"},{\"title\":\"text4\"},{\"title\":\"text5\"},{\"title\":\"text6\"}],\"subtitle\":\"mock_title\"}}}');
    });

    test('verify LexV2 elicit Response', () => {
        const mockResponse = lexFixtures.createResponseObject();
        mockResponse.session.qnabotcontext = "{\"elicitResponse\": {\"responsebot\": \"mock_response_bot\", \"responsetext\": \"mock_response_text\"}}"
        const assembledResponse = lex.assemble(lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2", "testIntent"),
            mockResponse);
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("ElicitIntent");
        expect(assembledResponse.messages[0].contentType).toEqual("PlainText");
        expect(assembledResponse.messages[0].content).toEqual('The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.');

    });

    test('verify LexV2 DialogCodeHookResponseTemplate', () => {
        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2");
        const mockResponse = lexFixtures.createResponseObject();
        mockRequest.invocationSource = "DialogCodeHook";
        //Delegate dialogAction
        let assembledResponse = lex.assemble(mockRequest,
            mockResponse);
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("Delegate");
        expect(assembledResponse.sessionState.state).toEqual("ReadyForFulfillment");
        expect(assembledResponse.sessionState.intent.slots.qnaslot).not.toBeDefined();

        //ElicitSlot dialogAction;
        mockResponse.nextSlotToElicit = "ElicitSlot";
        assembledResponse = lex.assemble(mockRequest,
            mockResponse);
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("ElicitSlot");
        expect(assembledResponse.sessionState.state).toEqual("InProgress");
        expect(assembledResponse.sessionState.intent.slots.qnaslot).not.toBeDefined();
    });


    test('verify LexV2 DialogCodeHookResponseTemplate', () => {
        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2");
        const mockResponse = lexFixtures.createResponseObject();
        mockRequest.invocationSource = "DialogCodeHook";
        mockResponse.nextSlotToElicit = "ElicitSlot";
        mockResponse.slots = {
            "qnaslot": {
                "shape": "Scalar",
                "value": {
                    "originalValue": "Test value",
                    "resolvedValues": [],
                    "interpretedValue": "Test value"
                }
            }
        };
        assembledResponse = lex.assemble(mockRequest,
            mockResponse);
        expect(assembledResponse.sessionState.dialogAction.type).toEqual("ElicitSlot");
        expect(assembledResponse.sessionState.state).toEqual("InProgress");
        expect(assembledResponse.sessionState.intent.slots.qnaslot.value).toEqual({
            "interpretedValue": {
                "shape": "Scalar",
                "value": {
                    "originalValue": "Test value",
                    "resolvedValues": [],
                    "interpretedValue": "Test value"
                }
            }
        });
    });



    test('verify LexV2 ImageResponseCard response', () => {
        const mockRequest = lexFixtures.createRequestObject("What is QnABot", "LEX.LexWebUI.Text", "V2");
        const mockResponse = lexFixtures.createResponseObject();
        //invalid image url
        mockResponse.card = { "title": "mock_title", "imageUrl": "mock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddffmock_urltsgfgnnjknjknjnjndfdsfdsgfdgfgkkkkkkkkkkkkkaaaaaaaaannnnnnddff", "send": true };
        let assembledResponse = lex.assemble(mockRequest,
            mockResponse);
        expect(assembledResponse.messages[1].contentType).toEqual("ImageResponseCard");
        expect(assembledResponse.messages[1].imageResponseCard.imageUrl).not.toBeDefined();

        //valid image url
        mockResponse.card = { "type": "Image", "title": "mock_title", "imageUrl": "mock_url", "send": true };
        assembledResponse = lex.assemble(mockRequest,
            mockResponse);
        expect(assembledResponse.messages[1].contentType).toEqual("ImageResponseCard");
        expect(assembledResponse.messages[1].imageResponseCard.imageUrl).toEqual("mock_url");
    });

});

