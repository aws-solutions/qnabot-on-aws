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

const run = require('./run.js');

module.exports = async function (version, result) {
    // update the version of the slot for the slot named 'slot'. All other slots are unaffected
    result.slots.forEach((element) => {
        if (element.name === 'slot') {
            element.slotTypeVersion = version;
        }
    });

    delete result.lastUpdatedDate;
    delete result.version;
    delete result.createdDate;

    const response = await run('putIntent', result)
    const checksum = response.checksum
    const createIntentVersion = await run('createIntentVersion', {
        name: result.name,
        checksum,
    })
    return createIntentVersion.version
};
