// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const aws=require('./aws')
const status=require('./statusv2')


var lambda=new aws.Lambda({
    httpOptions: {
        timeout: 900000 // time to wait for a response
        }
    });
var functionName=process.env.LEXV2_BUILD_LAMBDA;
var bucket=process.env.STATUS_BUCKET;
var lexV2StatusFile=process.env.LEXV2_STATUS_KEY;

module.exports=async function(utterances){
    const utterance_list = await utterances ; 
    console.log(`Invoking ${functionName} with Utterances: ${utterance_list}`)
    status("Starting LexV2 bot function")
    var result=await lambda.invoke({
        FunctionName:functionName,
        InvocationType: "RequestResponse",
        Payload: JSON.stringify(
            {
                "statusFile":{"Bucket":bucket, "Key":lexV2StatusFile},
                "utterances":utterance_list
            }
        )
    }).promise() ;
    console.log("LexV2 bot lambda result:" + JSON.stringify(result));
    if(result.FunctionError){
        console.log("Error Response");
        throw result;
    }
    return result;
}

