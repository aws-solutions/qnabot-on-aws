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
    "region":"us-east-1",
    "profile":"default",
    "publicBucket":"aws-bigdata-blog",
    "publicPrefix":"artifacts/aws-ai-qna-bot",
    "devEmail":""
}

if (require.main === module) {
    module.exports.devEmail=process.argv[2] || "user@example.com"
    module.exports.region=process.argv[3] || "us-east-1"
    console.log(JSON.stringify(module.exports,null,2))
}
