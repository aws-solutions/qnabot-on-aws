/*
Copyright 2017-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

const aws=require('./aws')
var lambda=new aws.Lambda({
    httpOptions: {
        timeout: 900000 // time to wait for a response
        }
    });
var functionName=process.env.LEXV2_BOT_LAMBDA;

module.exports=async function(utterances){
    const utterance_list = await utterances ; 
    console.log(`Invoking ${functionName} with Utterances: ${utterance_list}`)
    var result=await lambda.invoke({
        FunctionName:functionName,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify({"utterances":utterance_list})
    }).promise() ;
    console.log("LexV2 bot lambda result:" + JSON.stringify(result));
    if(result.FunctionError){
        console.log("Error Response");
        throw result;
    }
    return result;
}

