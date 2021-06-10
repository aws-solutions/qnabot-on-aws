/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

const lexV1Status=process.env.STATUS_KEY;
const getUtterances=require('./utterances');

module.exports=async function(params){ 
    const utterances=getUtterances(params);
    let promises=[];
    if (lexV1Status) {
        console.log("Starting Lex V1");
        let LexV1Bot=require('./lexv1bot');
        let lexV1 = LexV1Bot(utterances);
        promises.push(lexV1);
    }
    console.log("Starting Lex V2");
    let LexV2Bot=require('./lexv2bot');
    var lexV2 = LexV2Bot(utterances);
    promises.push(lexV2);
    await Promise.all(promises);
    console.log("All Done");
    return 1;
};

