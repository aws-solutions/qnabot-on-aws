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
var lambda=new aws.Lambda()
var build=require('./build.js')

module.exports=function(params,es){ 
    if(process.env.AWS_LAMBDA_FUNCTION_NAME){
        return lambda.invoke({
            FunctionName:process.env.AWS_LAMBDA_FUNCTION_NAME,
            Payload:JSON.stringify({
                "Command":"BUILD"
            }),
            InvocationType:"Event"
        }).promise()
        .return('started')
    }else{
        return build(params,es)        
    }
}


