/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var validator =new (require('jsonschema').Validator)();
var assert=require('assert')
var schema=require('./schema')

module.exports=function(event){
    var out
    if(event.currentIntent){
        process.env.TYPE="LEX"
        console.log("Processing as LEX")
        out={
            Command:"SEARCH",
            Query:event.inputTranscript,
            Session:event.sessionAttributes,
        }
    }else if(event.request){
        console.log("Processing as ALEXA")
        process.env.TYPE="ALEXA"
        if(event.request.type=='IntentRequest'){
            out={
                Command:"SEARCH",
                Query:event.request.intent.slots.QnA_slot.value,
                Session:event.session.attributes
            }
        }else if(event.request.type=='LaunchRequest'){
            out={
                Command:"ALEXA",
                Type:"start"
            }
        }else if(event.request.type=='SessionEndedRequest'){
            out={
                Command:"ALEXA",
                Type:"end"
            }
        }else{
            throw {message:"Invalid Alexa event object"}
        }
    }else{
        console.log("Processing as API")
        process.env.TYPE="API"
        out=event
    }
    
    var v=validator.validate(out, schema)
    assert(v.valid,"Invalid config:"+v.errors)
    return out
}




