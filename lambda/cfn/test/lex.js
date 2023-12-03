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

process.env.REGION = require('../../../config.json').region;
const lex = require('../lib/lex');
const Promise = require('bluebird');

const run = function (type, update) {
    return function (test) {
        const slot = Promise.promisifyAll(new lex(type));
        slot.CreateAsync({})
            .then(function (id) {
                return slot.UpdateAsync(id, { name: id, prefix: 'test' }, { name: id });
            })
            .tap(function (id) {
                return slot.UpdateAsync(id, Object.assign({ name: id }, update), { name: id });
            })
            .then(function (id) {
                return slot.DeleteAsync(id, { name: id });
            })
            .finally(test.done);
    };
};

module.exports = {
    slotType: run('SlotType', { description: 'helo' }),
    intent: run('Intent', { description: 'hello', fulfillmentActivity: { type: 'ReturnIntent' } }),
    botAlias: function (test) {
        const bot = Promise.promisifyAll(new lex('Bot'));
        const alias = Promise.promisifyAll(new lex('BotAlias'));

        let bot_id;
        bot.CreateAsync({
            'childDirected': 'false',
            'locale': 'en-US'
        })
            .delay(2000)
            .then(function (id) {
                bot_id = id;
                return alias.CreateAsync({
                    botName: id,
                    botVersion: '$LATEST'
                });
            })
            .delay(2000)
            .then(function (id) {
                return alias.DeleteAsync(id, { botName: bot_id });
            })
            .delay(2000)
            .then(function (id) {
                return bot.DeleteAsync(bot_id, { name: bot_id });
            })
            .finally(test.done);
    }
};
