var session={
    previous:JSON.stringify({
        qid:"test.1",
        q:"help",
        a:"ask a question"
    })
}

module.exports={
  "req": {
    "_type": "LEX",
    "question": "help",
    "session": session,
    "_original": {
      "currentIntent": {
        "name": "intent-name",
        "slots": {
          "slot-name": "value"
        },
        "confirmationStatus": "None, Confirmed, or Denied (intent confirmation, if configured)"
      },
      "bot": {
        "name": "bot-name",
        "alias": "bot-alias",
        "version": "bot-version"
      },
      "userId": "user-id specified in the POST request to Amazon Lex.",
      "inputTranscript": "help",
      "invocationSource": "FulfillmentCodeHook or DialogCodeHook",
      "outputDialogMode": "Text or Voice, based on ContentType request header in runtime API request",
      "messageVersion": "1.0",
      "sessionAttributes":session 
    },
    "_query": {
      "from": 0,
      "size": 1,
      "query": {
        "bool": {
          "should": [
            {
              "nested": {
                "path": "questions",
                "score_mode": "max",
                "boost": 2,
                "query": {
                  "match": {
                    "questions.q": "help"
                  }
                }
              }
            },
            {
              "match": {
                "a": "help"
              }
            },
            {
              "match": {
                "t": ""
              }
            }
          ]
        }
      }
    }
  },
  "res": {
    "type": "plaintext",
    "message": "",
    "session": {
      "key1": "value1",
      "key2": "value2"
    },
    "card": {
      "send": false,
      "title": "",
      "text": "",
      "url": ""
    }
  }
}

