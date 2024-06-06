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

module.exports = async function query(req, res) {
    //qna_settings.set_environment_variables(req._settings);
    console.log("Inside mock ES query function")
    const response = {
        "req": {
            "_type": 'LEX',
            "_clientType": "LEX.LexWebUI.Text",
            "_lexVersion": "V2",
            "_event": {
                "inputTranscript": "What is Q and A Bot",
                "userId": "mock_user_id",
                "sessionState": {
                    "intent": {
                        "name": "mockIntent"
                    },
                },
                "bot": {
                    "localeId": "en_US"
                }
            },
            "_settings": {
                "MINIMUM_CONFIDENCE_SCORE": 0.6,
                "ENFORCE_VERIFIED_IDENTITY": false,
                "ENABLE_REDACTING_WITH_COMPREHEND": false,
                "LAMBDA_PREPROCESS_HOOK": "",
                "IDENTITY_PROVIDER_JWKS_URLS": [],
                "NO_VERIFIED_IDENTITY_QUESTION": "no_verified_identity",
            },
            "session" : {
                "botName" : "QnABot"
            },
            "question": "What is Q and A Bot"
        },
        "res": {
            "type": "PlainText",
            "message": "The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.",
            "session": {
                "idtokenjwt": "<token redacted>",
                "qnabotcontext": {"elicitResponse":{}},
                "topic": "QnABot",
                "appContext": "",
                "qnabot_qid": "QnABot.001",
                "qnabot_gotanswer": "true",
                "botName": "QnABot"
            },
            "result": {
                "args": [],
                "a": "The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.",
            "questions": [
                {
                    "q": "What is Q and A Bot"
                }
            ],
            "type": "qna",
            "quniqueterms": "What is Q and A Bot",
            "qid": "QnABot.001",
            },
            
            "intentname": "FallbackIntent",
            "_userInfo": {
                "UserId": "Admin",
                "InteractionCount": 2,
                "UserName": "Admin",
                "isVerifiedIdentity": "true",
                "TimeSinceLastInteraction": 1697549029.593,
                "FirstSeen": "Wed Oct 18 2023 01:23:49 GMT+0000 (Coordinated Universal Time)",
                "LastSeen": "Wed Oct 18 2023 01:23:49 GMT+0000 (Coordinated Universal Time)",
            },
            "got_hits": 1,
            "plainMessage": "The Q and A Bot uses Amazon Lex and Alexa to provide a natural language interface for your FAQ knowledge base, so your users can just ask a question and get a quick and relevant answer.",
        }
    };


    if(req.session.specialtyLambda === "mock_query_lambda_arn_switch_bot_test"){
        response.res.got_hits = 1;
        response.res.result.qid = "specialty.001"
    }
    if(req.session.qnabotcontext.elicitResponse.responsebot === "testBot"){
        res.session.qnabotcontext.elicitResponse = {"progress": "Fulfilled"}
    }
    return response;
};