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

exports.createRequestObject = function (question,  qidExists) {
    const request = {
        "_event": {

        },
        "session": {
            "qnabotcontext": {
                'slot.test': 0
            },
            "idtokenjwt": "mock_id_token"
        },
        "question": question
    };

    if (qidExists) {
        request.qid = 10;
    }

    return request;
}

exports.createQueryResponseObject = {
   "hits": [
       {
           "_source": {
               "slots": {
                   "slotName": "test",
                   "slotRequired": true,
                   "slotValueCached": 10
               }
           }
       }
   ]
}
