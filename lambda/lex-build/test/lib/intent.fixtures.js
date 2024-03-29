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
