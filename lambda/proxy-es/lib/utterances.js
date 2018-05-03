/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var bodybuilder = require('bodybuilder')
var aws=require('aws-sdk')
var lex=new aws.LexModelBuildingService()
var _=require('lodash')

module.exports=async function(event,context,callback){
    try{
        var info=await lex.getSlotType(event).promise()

        return {utterances:_.uniqBy(_.flatten(info.enumerationValues
            .map(x=>[x.value].concat(x.synonyms))),
            x=>x.toUpperCase())}
    }catch(e){
        console.log(e)
        callback(e)
    }
}



