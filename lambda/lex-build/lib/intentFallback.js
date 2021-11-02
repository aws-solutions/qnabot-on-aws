// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
    
    
