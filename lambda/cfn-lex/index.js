/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var cfnLambda=require('cfn-lambda')
var Lex=require('./library')

exports.handler=function(event,context,cb){
    var type=event.ResourceType.match(/Custom::Lex(Bot|Alias|SlotType|Intent)/)
    console.log(type)
    if(type[1]==='Alias') type[1]='BotAlias'
    if(type){ 
        cfnLambda(new Lex(type[1]))(event,context,cb)
    }else{
        cb("Not Valid Resource:"+event.ResourceType)
    }
}
