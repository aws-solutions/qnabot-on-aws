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

module.exports=function(params){ 
    var utterances=getUtterances(params)
    
    var slottype=run("getSlotType",{
        name:params.slottype,
        version:"$LATEST"
    })
    var intent=run("getIntent",{
        name:params.intent,
        version:"$LATEST"
    })
    var bot=run('getBot',{
        name:params.botname,
        versionOrAlias:"$LATEST"
    })
    
    return Promise.join(utterances,slottype)
        .tap(x=>console.log("--------------rebuilding slot"))
        .spread(Slot)

        .tap(x=>console.log("--------------rebuilding Intent"))
        .then(slot_version=>Promise.join(slot_version,intent))
        .spread(Intent)

        .tap(x=>console.log("--------------rebuilding Bot"))
        .then(intent_version=>Promise.join(intent_version,bot))
        .spread(Bot)

        .tap(x=>console.log("--------------deleting old"))
        .then(version=>clean.bot(params.botname,version))
        .then(version=>clean.intent(params.intent,version))
        .then(version=>clean.slot(params.slottype,version))
        .tapCatch(console.log)
}

