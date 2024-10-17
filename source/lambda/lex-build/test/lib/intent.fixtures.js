/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */


exports.returnResult = function(isSlotName) {
    const result = {
        'name': 'test-index',
        'slots': [
            {
                'name': '',
                'slotTypeVersion': '1.0'
            },
            {
                'name': 'notSlot',
                'slotTypeVersion': '1.0'
            }
        ],
        'status': 'Failed',
       'failureReason': 'timeout',
       'lastUpdatedDate': '12/03/2023',
       'createdDate': '10/27/2023',
       'version': '2.0'
    };

    if (isSlotName) {
        result.slots[0].name = 'slot';
    } else {
        result.slots[0].name = 'notSlot';
    }

    return result;
};
