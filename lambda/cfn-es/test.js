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
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=process.env.REGION || 'us-east-1'

var cf=new aws.CloudFormation()
var base={
  "StackId": "stackid",
  "ResponseURL": "http://localhost:8000/test",
  "ResourceProperties": {
    Index:"test-index",
    Type:"test-type"
  },
  "RequestType": "Create",
  "ResourceType": "Custom::EsInit",
  "RequestId": "unique id for this create request",
  "LogicalResourceId": "MyTestResource"
}

module.exports=function(){
    return cf.listExports().promise()
    .get("Exports")
    .then(function(exports){
        var out={}
        exports.forEach(el=>out[el.Name]=el.Value)
        base.ResourceProperties.Address=out["QNA-DEV-ED-ADDRESS"]
    })
    .then(()=>base)
}



