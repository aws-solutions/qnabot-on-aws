// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const run=require('./run.js')

module.exports=function(version,result){
    // update the version of the slot for the slot named 'slot'. All other slots are unaffected
    result.slots.forEach(element => {
        if (element.name === "slot") {
            element.slotTypeVersion = version;
        }
    });
    
    delete result.lastUpdatedDate
    delete result.version
    delete result.createdDate
    
    return run('putIntent',result)
    .get('checksum')
    .then(function(checksum){
        return run('createIntentVersion',{
            name:result.name,
            checksum
        })
        .get('version')
    })
}
    
    
