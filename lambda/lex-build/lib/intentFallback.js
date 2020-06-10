/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

const run=require('./run.js')

module.exports=function(version, result){
    delete result.lastUpdatedDate
    delete result.version
    delete result.createdDate

    let res = {};
    res.intent_version = version;

    return run('putIntent',result)
        .get('checksum')
        .then(function(checksum){
            return run('createIntentVersion',{
                name:result.name,
                checksum
            })
                .get('version')
                .then(version => {
                    res.intentFallback_version = version;
                    return(res);
                });
        })
}
    
    
