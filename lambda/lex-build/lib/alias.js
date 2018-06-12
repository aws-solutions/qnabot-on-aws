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
var getUtterances=require('./utterances')
var Slot=require('./slot')
var Intent=require('./intent')
var _=require('lodash')
var run=require('./run')

module.exports=async function(version,data){
    var alias=await run('getBotAlias',data)
    var checksum=alias.checksum
    
    var update=await run('putBotAlias',{
        botName:data.botName,
        botVersion:version,
        name:data.name,
        checksum:checksum
    })
}

