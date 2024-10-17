/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

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

