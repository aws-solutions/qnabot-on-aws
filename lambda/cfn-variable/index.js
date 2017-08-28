/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var response=require('cfn-response')
var crypto=require('crypto')

var id=function(params){
    console.log('Creating CFN variable: %j', params);
    
    var jsonString = JSON.stringify(params);
    var id = crypto
            .createHash('sha256')
            .update(jsonString)
            .digest('hex')

    return new Buffer(jsonString).toString('base64');
}

exports.handler=function(event,context,cb){
    var params=event.ResourceProperties
    response.send(event,context,response.SUCCESS,params,id(params))
}
