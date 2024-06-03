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
const run = require('./run.js');

exports.bot = async function(name, version) {
    try {
        const res = await run('getBotVersions', { name });
        const versions = res.bots
            .map(x => x.version)
            .filter(x => !_.includes(['$LATEST', version], x))
            .map(x => run('deleteBotVersion', { name, version: x }));
        return await Promise.all(versions); 
    } catch (error) {
        console.error("An error occurred during getBotVersions: ", error);
        throw error;
    }
};

exports.intent = async function(name, version) {
    try {
        const res = await run('getIntentVersions', { name });
        const versions = res.intents
            .map(x => x.version)
            .filter(x => !_.includes(['$LATEST', version], x))
            .map(x => run('deleteIntentVersion', { name, version: x }));
        return await Promise.all(versions);
    } catch (error) {
        console.error("An error occurred during getIntentVersions: ", error);
        throw error;
    }
};

exports.slot = async function(name, version) {
    try {
        const res = await run('getSlotTypeVersions', { name });
        const versions = res.slotTypes
            .map(x => x.version)
            .filter(x => !_.includes(['$LATEST', version], x))
            .map(x => run('deleteSlotTypeVersion', { name, version: x }));
        return await Promise.all(versions);
    } catch (error) {
        console.error("An error occurred during getSlotTypeVersions: ", error); 
        throw error;
    }
};