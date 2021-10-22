// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const Promise=require('bluebird')
const run=require('./run')
const getUtterances=require('./utterances')
const Slot=require('./slot')
const Intent=require('./intent')
const IntentFallback=require('./intentFallback')
const Alias=require('./alias')
const Bot=require('./bot')
const clean=require('./delete')
const status=require('./statusv1')
const wait=require('./wait')

module.exports=function(utterances){
    const slottype=run("getSlotType",{
        name:process.env.SLOTTYPE,
        version:"$LATEST"
    })
    const intent=run("getIntent",{
        name:process.env.INTENT,
        version:"$LATEST"
    })
    const intentFallback=run("getIntent",{
        name:process.env.INTENTFALLBACK,
        version:"$LATEST"
    })
    const bot=run('getBot',{
        name:process.env.BOTNAME,
        versionOrAlias:"$LATEST"
    })
    let clean_intent=null
    let clean_intentFallback=null
    let clean_slottype=null
    let clean_slot=null

    return Promise.join(utterances,slottype)
        .tap(status("Rebuilding Slot"))
        .spread(Slot)

        .tap(()=>status("Rebuilding Intent"))
        .then(slot_version=>{
            clean_intent=()=>clean.intent(process.env.INTENT,slot_version)
            return Promise.join(slot_version,intent)
        })
        .spread(Intent)

        .tap(()=>status("Rebuilding IntentFallback"))
        .then(intent_version=>{
            clean_intentFallback=()=>clean.intent(process.env.INTENTFALLBACK,intent_version)
            return Promise.join(intent_version,intentFallback)
        })
        .spread(IntentFallback)

        .tap(versions=>status("Rebuilding Lex V1 Bot"))
        .then(versions=>{
            clean_slot=()=>clean.slot(process.env.SLOTTYPE,versions.intent_version)
            return Promise.join(versions,bot)
        })
        .spread(Bot)

        .tap(version=>Alias(version,{
            botName:process.env.BOTNAME,
            name:process.env.BOTALIAS
        }))
        
        .delay(1000)
        .tap(()=>wait())
        .then(version=>clean.bot(process.env.BOTNAME,version))
        .then(clean_intent)
        .then(clean_slottype)
        .tapCatch(console.log)
        .catch(error=>status("Failed",error.message))  
}
