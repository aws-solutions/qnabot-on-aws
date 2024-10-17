/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const cache = require('../../../lib/middleware/6_cache');

describe('when calling cache function', () => {

    test('should update cachedOutput in response if response has out.response', async () => {
        const res = {
            "type": "PlainText",
            "out": {
                "sessionState": {
                    "sessionAttributes": {
                        "userDetectedLocale": "en",
                        "userDetectedLocaleConfidence": "0.9905813932418823",
                        "qnabotcontext": "",
                        "qnabot_qid": "test.001",
                        "qnabot_gotanswer": "true",
                    },
                    "intent": {
                        "name": "FallbackIntent",
                        "state": "Fulfilled"
                    }
                },
                "sessionAttributes": {},
                "response": "test_response"
            }
        }
        const result = await cache({}, res);
        expect(result.res.out.sessionAttributes.cachedOutput).toEqual("test_response");
    });

    test('should not update cachedOutput in response if response does not have out.response', async () => {
        const res = {
            "type": "PlainText",
            "out": {
                "sessionState": {
                    "sessionAttributes": {
                        "userDetectedLocale": "en",
                        "userDetectedLocaleConfidence": "0.9905813932418823",
                        "qnabotcontext": "",
                        "qnabot_qid": "test.001",
                        "qnabot_gotanswer": "true",
                    },
                    "intent": {
                        "name": "FallbackIntent",
                        "state": "Fulfilled"
                    }
                }
            }
        }
        const result = await cache({}, res);
        expect(result.res).toEqual(res);
    });
});