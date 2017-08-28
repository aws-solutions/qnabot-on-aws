/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

module.exports={
  "StackId": "stackid",
  "ResponseURL": "http://pre-signed-S3-url-for-response",
  "ResourceProperties": {
    "password":"hello"
  },
  "RequestType": "Delete",
  "ResourceType": "Custom::LexAlias",
  "RequestId": "unique id for this create request",
  "LogicalResourceId": "MyTestResource"
}
