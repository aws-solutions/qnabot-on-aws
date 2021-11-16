// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

process.env.REGION=require('../../../config').region
var lex=require('../lib/lex')
var Promise=require('bluebird')

var run=function(type,update){
    return function(test){
        var slot=Promise.promisifyAll(new lex(type))
        slot.CreateAsync({})
        .then(function(id){
            return slot.UpdateAsync(id,{name:id,prefix:'test'},{name:id})
        })
        .tap(function(id){
            return slot.UpdateAsync(id,Object.assign({name:id},update),{name:id})
        })
        .then(function(id){
            return slot.DeleteAsync(id,{name:id})
        })
        .finally(test.done)
    }
}

module.exports={
    slotType:run('SlotType',{description:'helo'}),
    intent:run('Intent',{description:'hello',fulfillmentActivity: {type: "ReturnIntent"}}),
    botAlias:function(test){
        var bot=Promise.promisifyAll(new lex('Bot'))
        var alias=Promise.promisifyAll(new lex('BotAlias'))

        var bot_id
        bot.CreateAsync({
            "childDirected":"false",
            "locale":"en-US"
        })
        .delay(2000)
        .then(function(id){
            bot_id=id
            return alias.CreateAsync({
                botName:id,
                botVersion:"$LATEST"
            })
        })
        .delay(2000)
        .then(function(id){
            return alias.DeleteAsync(id,{botName:bot_id})
        })
        .delay(2000)
        .then(function(id){
            return bot.DeleteAsync(bot_id,{name:bot_id})
        })
        .finally(test.done)
    }
}
