/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.mockLambdaParams = {
    "FunctionName": "mock_lambda",
    "Payload": { "req": "mock_request", "res": "mock_response" }
};

exports.mockLambdaParamsLex = {
    "FunctionName": "mock_lambda",
    "req": {
        "_type": "LEX",
        "_settings": {
            "ERRORMESSAGE": "Unfortunately I encountered an error when searching for your answer. Please ask me again later."
        }
    },
    "res": {}
};

exports.mockLambdaParamsAlexa = {
    "FunctionName": "mock_lambda",
    "req": {
        "_type": "ALEXA",
        "_settings": {
            "ERRORMESSAGE": "Unfortunately I encountered an error when searching for your answer. Please ask me again later."
        }
    },
    "res": {}
};

exports.mockLambdaResponse = {
    "StatusCode": 200,
    "FunctionError": "",
    "Payload": '{"response": "mock_response" }',
    "ExecutedVersion": "LATEST",
};

exports.mockLambdaResponseError = {
    "StatusCode": 200,
    "FunctionError": "mock_error",
    "Payload": "mock_response",
    "ExecutedVersion": "LATEST",
};

exports.mockLambdaResponseInvalid = {
    "StatusCode": 200,
    "FunctionError": "",
    "Payload": "mock_response",
    "ExecutedVersion": "LATEST",
};

exports.LexError = {
    "action": "RESPOND",
    "message": {
        "dialogAction": {
            "type": "Close", "fulfillmentState": "Fulfilled",
            "message": {
                "contentType": "PlainText", "content": "Unfortunately I encountered an error when searching for your answer. Please ask me again later."
            }
        }
    }
}

exports.AlexaError = {
    "action": "RESPOND",
    "message": {
      "version": "1.0",
      "response": {
        "outputSpeech": {
          "type": "PlainText",
          "text": "Unfortunately I encountered an error when searching for your answer. Please ask me again later."
        },
        "card": {
          "type": "Simple",
          "title": "Processing Error",
          "content": "Unfortunately I encountered an error when searching for your answer. Please ask me again later."
        },
        "shouldEndSession": true
      }
    }
  }