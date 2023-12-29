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

const run = require('./run');
const Slot = require('./slot');
const Intent = require('./intent');
const IntentFallback = require('./intentFallback');
const Alias = require('./alias');
const Bot = require('./bot');
const clean = require('./delete');
const status = require('./statusv1');
const wait = require('./wait');

module.exports = async function(utterances){
    const slottype = await run('getSlotType', {
        name: process.env.SLOTTYPE,
        version: '$LATEST',
    });
    const intent = await run('getIntent', {
        name: process.env.INTENT,
        version: '$LATEST',
    });
    const intentFallback = await run('getIntent', {
        name: process.env.INTENTFALLBACK,
        version: '$LATEST',
    });
    const bot = await run('getBot', {
        name: process.env.BOTNAME,
        versionOrAlias: '$LATEST',
    });

    let clean_intent = null;
    let clean_intentFallback = null;
    const clean_slottype = null;
    let clean_slot = null;
    return Promise.all([utterances, slottype])
        .then(result => {
            status('Rebuilding Slot');
            return result;
        })
        .then(results => {
            return Slot(...results);
        })
        .then(result => {
            status('Rebuilding Intent');
            return result;
        })
        .then(slot_version=>{
            clean_intent = () => clean.intent(process.env.INTENT, slot_version);
            return Promise.all([slot_version, intent]);
        })
        .then(results => {
            return Intent(...results);
        })
        .then(result => {
            status('Rebuilding IntentFallback');
            return result;
        })
        .then(intent_version => {
            clean_intentFallback = () => clean.intent(process.env.INTENTFALLBACK, intent_version);  // NOSONAR  need to retain clean_intentFallback status
            return Promise.all([intent_version, intentFallback]);
        })
        .then(results => {
            return IntentFallback(...results);
        })
        .then(result => {
            status('Rebuilding Lex V1 Bot');
            return result;
        })
        .then(versions=>{
            clean_slot = () => clean.slot(process.env.SLOTTYPE, versions.intent_version);  // NOSONAR need to retain clean_slot status
            return Promise.all([versions, bot]);
        })
        .then(results => {
            return Bot(...results);
        })
        .then(version => {
            Alias(version, { botName : process.env.BOTNAME, name : process.env.BOTALIAS});
            return version;
        })
        .then(result => new Promise(res => setTimeout(res(result), 1000)))
        .then(result => {
            wait();
            return result;
        })
        .then(version => clean.bot(process.env.BOTNAME, version))
        .then(clean_intent)
        .then(clean_slottype)
        .then(result => {
            console.log(result);
            return result;
        })
        .catch(error => status('Failed', error.message))
}
