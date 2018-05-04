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
var run=require('./run.js')

exports.bot=function(name,version){
    return run('getBotVersions',{name}).get('bots')
    .filter(type=>["$LATEST",version].indexOf(type.version)===-1)
    .map(x=>run('deleteBotVersion',{name,version:x.version}))
}
exports.intent=function(name,version){
    return run('getIntentVersions',{name,}).get('intents')
    .filter(type=>["$LATEST",version].indexOf(type.version)===-1)
    .map(x=>run('deleteIntentVersion',{name,version:x.version }))
}
exports.slot=function(name,version){
    return run('getSlotTypeVersions',{name}).get('slotTypes')
    .filter(type=>["$LATEST",version].indexOf(type.version)===-1)
    .map(x=>run('deleteSlotTypeVersion',{name,version:x.version}))
}

