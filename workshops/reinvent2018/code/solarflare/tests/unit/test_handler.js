/**
 * Use export DEBUG="solarflare node app.js" to emit debug statements
 */

'use strict';
const debug = require('debug')('solarflare');
const name = 'solarflare';
debug('running %s', name);
process.env['api_key'] = 'DEMO_KEY';
const app = require('../../app.js');
const chai = require('chai');
const expect = chai.expect;
var context;


function baseevent() {
  return {
    "req": {
      "_event": {
        "messageVersion": "1.0",
        "invocationSource": "FulfillmentCodeHook",
        "userId": "us-east-1:d972f1fd-ef0c-49a6-b84e-121307836066",
        "sessionAttributes": {
          "accesstokenjwt": "eyJraWQiOiJnMElnc0dPZVwvTDVzZnBHMm1jZWJSNnJXMTkwUUVZVUdGY0xMT0VvQlYyWT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhYTMyYWMzYi1iMzdmLTQxMTUtOGZhNi03NmYyOTI4YzNjNzkiLCJldmVudF9pZCI6ImY2YWM1MDcxLWIxZjItMTFlOC05MWY0LWNkYWY4MzBlZTI1YyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE1MzYyNTE3NzEsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX01YRTZoTTlmNCIsImV4cCI6MTUzNjI1NTM3MSwiaWF0IjoxNTM2MjUxNzcxLCJ2ZXJzaW9uIjoyLCJqdGkiOiIyNzVmNWVmMy1lMGYzLTQyNTEtODQyZi0xNjU4NDY5N2Y5NjQiLCJjbGllbnRfaWQiOiI2aHZ2OWI3M2tvM2I4MW1kc2J2bmRoOXNwaCIsInVzZXJuYW1lIjoiYm9icHNraWVyIn0.Sdgfvp4HKJiJi4SSza__t1aPN7MnHnFmBOP8tP-cAuJqVn_7LSGRAbylPW_GhQKBPznXqCySUerhqOl5Dc1wMdfnU78AsPpEZy354otCN1AwCpY35n1c20SBhI56v23rWKLqfY6PjY78SgO8u6MM4qBhxe1twQfEAqWsyYZRggS7M66xYhlHAm1FYwIUgHQBd_aSh_9KTCF566Az3NBQudW6IZmFQzXb3XgE3UmJgxSVbxvzvGvF6AKpNOlWEieCq9ycdFpooDDsG-acVMn7hamcaoCBPD6Used8Z32SSec_m1DCsIcoVJYx-GJSxihH-bFaYnqbj1a6muxNnS62SA",
          "localTimeZone": "\"America/Chicago\"",
          "idtokenjwt": "eyJraWQiOiJwUXN5XC9FVlN5cWVwbVdLZ25vekkyQTBYMUFENzZqVzJ4dFVIZHpTdEJqMD0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoidHFQaHNYV1JfZWZQeTNTakJuUjJQUSIsInN1YiI6ImFhMzJhYzNiLWIzN2YtNDExNS04ZmE2LTc2ZjI5MjhjM2M3OSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9NWEU2aE05ZjQiLCJjb2duaXRvOnVzZXJuYW1lIjoiYm9icHNraWVyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiUm9iZXJ0IiwiZ2l2ZW5fbmFtZSI6IkJvYiIsImF1ZCI6IjZodnY5Yjcza28zYjgxbWRzYnZuZGg5c3BoIiwiZXZlbnRfaWQiOiJmNmFjNTA3MS1iMWYyLTExZTgtOTFmNC1jZGFmODMwZWUyNWMiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTUzNjI1MTc3MSwiZXhwIjoxNTM2MjU1MzcxLCJpYXQiOjE1MzYyNTE3NzEsImZhbWlseV9uYW1lIjoiUG90dGVydmVsZCIsImVtYWlsIjoicG90dGVydmVAYW1hem9uLmNvbSJ9.F2WeBW2_oTWG2f5ZAROudwVrnAlej3I1Gnt3Bl908Cjr0-KRLwGsSjtX9vnG15LiwmS6DaHY-YyusoJUhic0dAeOtfAWjo-UHYWdYmaBQMHHYLg4jlZN-2XrJPGyP6jleRd3zHqmwwKSpZxVtFEHW26lgBPOqYU1FVjZPCgQoV36Or9uQQe7HJ6xXAcSaCJbiVdpbj0zs9dLVb7pVYxCabddhNb-pEhrFBCcqNfLWttfcBaD19clBjLkMEjf317JevO9TDcC34ydLEqN-SSxlhXNCE3lIAjROhX5uX_fw27IPvnScH4WT-4EgKaJuDw8C1FhmK2nIGYMflGmKKsFMw"
        },
        "requestAttributes": null,
        "bot": {
          "name": "TestBotString",
          "alias": "$LATEST",
          "version": "$LATEST"
        },
        "outputDialogMode": "Text",
        "currentIntent": {
          "name": "fulfilment_IntentoWOXqjC",
          "slots": {
            "slot": "yes"
          },
          "slotDetails": {
            "slot": {
              "resolutions": [
                {
                  "value": "yes"
                },
                {
                  "value": "Yes"
                }
              ],
              "originalValue": "yes"
            }
          },
          "confirmationStatus": "None"
        },
        "inputTranscript": "When were the last solar flares"
      },
      "_type": "LEX",
      "question": "yes",
      "session": {
        "accesstokenjwt": "eyJraWQiOiJnMElnc0dPZVwvTDVzZnBHMm1jZWJSNnJXMTkwUUVZVUdGY0xMT0VvQlYyWT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJhYTMyYWMzYi1iMzdmLTQxMTUtOGZhNi03NmYyOTI4YzNjNzkiLCJldmVudF9pZCI6ImY2YWM1MDcxLWIxZjItMTFlOC05MWY0LWNkYWY4MzBlZTI1YyIsInRva2VuX3VzZSI6ImFjY2VzcyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhdXRoX3RpbWUiOjE1MzYyNTE3NzEsImlzcyI6Imh0dHBzOlwvXC9jb2duaXRvLWlkcC51cy1lYXN0LTEuYW1hem9uYXdzLmNvbVwvdXMtZWFzdC0xX01YRTZoTTlmNCIsImV4cCI6MTUzNjI1NTM3MSwiaWF0IjoxNTM2MjUxNzcxLCJ2ZXJzaW9uIjoyLCJqdGkiOiIyNzVmNWVmMy1lMGYzLTQyNTEtODQyZi0xNjU4NDY5N2Y5NjQiLCJjbGllbnRfaWQiOiI2aHZ2OWI3M2tvM2I4MW1kc2J2bmRoOXNwaCIsInVzZXJuYW1lIjoiYm9icHNraWVyIn0.Sdgfvp4HKJiJi4SSza__t1aPN7MnHnFmBOP8tP-cAuJqVn_7LSGRAbylPW_GhQKBPznXqCySUerhqOl5Dc1wMdfnU78AsPpEZy354otCN1AwCpY35n1c20SBhI56v23rWKLqfY6PjY78SgO8u6MM4qBhxe1twQfEAqWsyYZRggS7M66xYhlHAm1FYwIUgHQBd_aSh_9KTCF566Az3NBQudW6IZmFQzXb3XgE3UmJgxSVbxvzvGvF6AKpNOlWEieCq9ycdFpooDDsG-acVMn7hamcaoCBPD6Used8Z32SSec_m1DCsIcoVJYx-GJSxihH-bFaYnqbj1a6muxNnS62SA",
        "localTimeZone": "America/Chicago",
        "idtokenjwt": "eyJraWQiOiJwUXN5XC9FVlN5cWVwbVdLZ25vekkyQTBYMUFENzZqVzJ4dFVIZHpTdEJqMD0iLCJhbGciOiJSUzI1NiJ9.eyJhdF9oYXNoIjoidHFQaHNYV1JfZWZQeTNTakJuUjJQUSIsInN1YiI6ImFhMzJhYzNiLWIzN2YtNDExNS04ZmE2LTc2ZjI5MjhjM2M3OSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9NWEU2aE05ZjQiLCJjb2duaXRvOnVzZXJuYW1lIjoiYm9icHNraWVyIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiUm9iZXJ0IiwiZ2l2ZW5fbmFtZSI6IkJvYiIsImF1ZCI6IjZodnY5Yjcza28zYjgxbWRzYnZuZGg5c3BoIiwiZXZlbnRfaWQiOiJmNmFjNTA3MS1iMWYyLTExZTgtOTFmNC1jZGFmODMwZWUyNWMiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTUzNjI1MTc3MSwiZXhwIjoxNTM2MjU1MzcxLCJpYXQiOjE1MzYyNTE3NzEsImZhbWlseV9uYW1lIjoiUG90dGVydmVsZCIsImVtYWlsIjoicG90dGVydmVAYW1hem9uLmNvbSJ9.F2WeBW2_oTWG2f5ZAROudwVrnAlej3I1Gnt3Bl908Cjr0-KRLwGsSjtX9vnG15LiwmS6DaHY-YyusoJUhic0dAeOtfAWjo-UHYWdYmaBQMHHYLg4jlZN-2XrJPGyP6jleRd3zHqmwwKSpZxVtFEHW26lgBPOqYU1FVjZPCgQoV36Or9uQQe7HJ6xXAcSaCJbiVdpbj0zs9dLVb7pVYxCabddhNb-pEhrFBCcqNfLWttfcBaD19clBjLkMEjf317JevO9TDcC34ydLEqN-SSxlhXNCE3lIAjROhX5uX_fw27IPvnScH4WT-4EgKaJuDw8C1FhmK2nIGYMflGmKKsFMw"
      },
      "_info": {
        "es": {
          "address": "esaddr",
          "index": "qna-esdomaintest",
          "type": "qna",
          "service": {
            "qid": "RATE2AD8VVU9",
            "proxy": "1OX68TDY3CP16"
          }
        }
      }
    },
    "res": {
      "type": "PlainText",
      "message": "TestPlainText.",
      "session": {
        "accesstokenjwt": "AccessToken",
        "localTimeZone": "America/Chicago",
        "idtokenjwt": "IdToken",
        "appContext": {
          "altMessages": {
            "markdown": "",
            "ssml": ""
          }
        },
        "topic": "A1",
        "previous": {
          "qid": "A1.1",
          "a": "TestAnswer.",
          "alt": {
            "markdown": "",
            "ssml": ""
          },
          "q": "yes"
        },
        "navigation": {
          "next": "",
          "previous": [],
          "hasParent": false
        }
      },
      "card": {
        "send": true,
        "title": "Suggestions",
        "text": "",
        "url": "",
        "subTitle": "",
        "imageUrl": "",
      },
      "result": {
        "next": "",
        "args": [
          "A1.2"
        ],
        "questions": [
          {
            "q": "Yes"
          }
        ],
        "a": "Test Answer.",
        "r": {
          "subTitle": "",
          "imageUrl": "",
          "title": ""
        },
        "t": "A1",
        "alt": {
          "markdown": "",
          "ssml": ""
        },
        "l": "",
        "qid": "A1.1",
        "type": "qna"
      },
      "plainMessage": "Test Plain Text."
    }
  }
}


describe('Test axios request', function () {
  it('verifies successful response', async () => {
    let testEvent = baseevent();
    const result = await app.lambdaHandler(testEvent, context);
    expect(result).to.be.an('object');
  });
});
