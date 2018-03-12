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

module.exports=function(version,data){
    data.intents[0].intentVersion=version
    delete data.status
    delete data.failureReason
    delete data.lastUpdatedDate
    delete data.createdDate
    delete data.version

    return run('putBot',data).get('checksum')
    .then(function(checksum){
        return run('createBotVersion',{
            name:data.name,
            checksum
        })
    })
    .get('version')
}

