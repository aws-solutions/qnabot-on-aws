/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var aws=require('./aws')
var lex=new aws.LexModelBuildingService()
var _=require('lodash')
var run=require('./run')
var getUtterances=require('./utterances')
var Slot=require('./slot')
var Intent=require('./intent')
var Bot=require('./bot')
var clean=require('./delete')
var status=require('./status')
var wait=require('./wait')

module.exports=function(params){ 
    var utterances=getUtterances(params)
    
    var slottype=run("getSlotType",{
        name:process.env.SLOTTYPE,
        version:"$LATEST"
    })
    var intent=run("getIntent",{
        name:process.env.INTENT,
        version:"$LATEST"
    })
    var bot=run('getBot',{
        name:process.env.BOTNAME,
        versionOrAlias:"$LATEST"
    })
    var clean_intent=null
    var clean_slottype=null

    return Promise.join(utterances,slottype)
        .tap(status("Rebuilding Slot"))
        .spread(Slot)

        .tap(status("Rebuilding Intent"))
        .then(slot_version=>{
            clean_slottype=()=>clean.intent(process.env.INTENT,slot_version)
            return Promise.join(slot_version,intent)
        })
        .spread(Intent)

        .tap(status("Rebuild Bot"))
        .then(intent_version=>{
            clean_intent=()=>clean.slot(process.env.SLOTTYPE,version)
            return Promise.join(intent_version,bot)
        })
        .spread(Bot)
        .delay(1000)
        .then(()=>wait())
        .then(version=>clean.bot(process.env.BOTNAME,version))
        .then(clean_intent)
        .then(clean_slottype)
        .tapCatch(console.log)
        .catch(error=>status("Failed")(error.message))
}

