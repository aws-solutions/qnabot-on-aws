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

const _ = require('lodash');
const run = require('./run');

module.exports = async function (utterances, slottype) {
    console.log(`utterances=${utterances}`);

    slottype.enumerationValues = _.uniqBy(
        utterances.map((x) => ({ value: x })),
        (x) => x.value,
    ).slice(0, 10000);

    delete slottype.lastUpdatedDate;
    delete slottype.createdDate;
    delete slottype.version;

    const response = await run('putSlotType', slottype)
    const checksum = response.checksum
    const createSlotTypeVersion = await run('createSlotTypeVersion', {
        name: slottype.name,
        checksum,
    })
    return createSlotTypeVersion.version
};
