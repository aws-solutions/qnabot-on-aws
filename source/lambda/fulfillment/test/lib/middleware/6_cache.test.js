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