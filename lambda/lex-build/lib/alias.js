// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const run=require('./run')

module.exports=async function(version,data){
    const alias=await run('getBotAlias',data)
    const checksum=alias.checksum
    
    await run('putBotAlias',{
        botName:data.botName,
        botVersion:version,
        name:data.name,
        checksum:checksum
    })
}

