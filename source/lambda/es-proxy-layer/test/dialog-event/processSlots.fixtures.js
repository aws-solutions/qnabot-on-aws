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

exports.returnHit = function (hasCacheValue) {
    const hit = {
        "slots": [{
            "slotName": "test",
            "slotRequired": true
        }]
    };

    if (hasCacheValue) {
        hit.slots[0].slotValueCached=10;
    }
    return hit;
}

exports.createRequestObject = function (question,  hasSlotValue) {
    const request = {
        "_event": {

        },
        "session": {
            "qnabotcontext": {
                'slot.test': 0
            },
            "idtokenjwt": "mock_id_token"
        },
        "slots": {
        },
        "question": question
    };

    if (hasSlotValue) {
        request.slots.test = 5;  //5 is SlotValue and 10 is slotCachedValue
    }
    return request;
}

exports.createResponseObjectWithSession = {
    'session': {
        'qnabotcontext.slot.test': 10
    }
}

