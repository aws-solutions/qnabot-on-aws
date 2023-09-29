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

module.exports = function (utterances) {
    const slottype = run('getSlotType', {
        name: process.env.SLOTTYPE,
        version: '$LATEST',
    });
    const intent = run('getIntent', {
        name: process.env.INTENT,
        version: '$LATEST',
    });
    const intentFallback = run('getIntent', {
        name: process.env.INTENTFALLBACK,
        version: '$LATEST',
    });
    const bot = run('getBot', {
        name: process.env.BOTNAME,
        versionOrAlias: '$LATEST',
    });
    let clean_intent = null;
    let clean_intentFallback = null;
    const clean_slottype = null;
    let clean_slot = null;

    return Promise.all([utterances, slottype])
        .then(results => {
            status('Rebuilding Slot')
            return Slot(...results)
        })
        .then(slot_version => {
            status('Rebuilding Intent')
            clean_intent = () => clean.intent(process.env.INTENT, slot_version);
            return Promise.all([slot_version, intent]);
        })
        .then(results => {
            return Intent(...results)
        })
        .then((intent_version) => {
            status('Rebuilding IntentFallback')
            clean_intentFallback = () => clean.intent(process.env.INTENTFALLBACK, intent_version);
            return Promise.all([intent_version, intentFallback]);
        })
        .then(results => {
            return IntentFallback(...results)
        })
        .then((versions) => {
            status('Rebuilding Lex V1 Bot')
            clean_slot = () => clean.slot(process.env.SLOTTYPE, versions.intent_version);
            return Promise.all([versions, bot]);
        })
        .then(results => {
            return Bot(...results)
        })
        .then((version) => {
            Alias(version, {
                botName: process.env.BOTNAME,
                name: process.env.BOTALIAS,
        })
        return version
    })
    .then(() => delay(1000))
    .then(() => wait())
    .then((version) => clean.bot(process.env.BOTNAME, version))
    .then(clean_intent)
    .then(clean_slottype)
    .catch((error) => {
        console.log(error)
        status('Failed', error.message)
    });
};

function delay(ms) {
    return new Promise(res => setTimeout(res, ms))
}