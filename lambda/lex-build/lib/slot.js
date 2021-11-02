// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const _=require('lodash')
const run=require('./run')

module.exports=function(utterances,slottype){
    console.log("utterances="+utterances)
    
    slottype.enumerationValues=_.uniqBy(
        utterances.map(x=>{return {value:x}})
        ,x=>x.value
    ).slice(0,10000)

    delete slottype.lastUpdatedDate
    delete slottype.createdDate
    delete slottype.version
    
    return run('putSlotType',slottype).get("checksum")
    .then(function(checksum){
        return run('createSlotTypeVersion',{
            name:slottype.name,
            checksum
        }).get('version')
    })
}
