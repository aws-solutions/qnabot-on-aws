/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

const Promise=require('bluebird')
const run=require('./run')

module.exports=async function(versionobj,data){
    if (data.intents[0]['intentName'] && (data.intents[0]['intentName'].startsWith('fulfilment_'))) {
        data.intents[0].intentVersion=versionobj.intent_version
        if (data.intents.length > 1) {
            data.intents[1].intentVersion=versionobj.intentFallback_version
        }
    } else {
        data.intents[1].intentVersion=versionobj.intent_version
        data.intents[0].intentVersion=versionobj.intentFallback_version
    }
    delete data.status
    delete data.failureReason
    delete data.lastUpdatedDate
    delete data.createdDate
    delete data.version

    const bot=await run('putBot',data)
    const checksum=bot.checksum
    
    const result=await run('createBotVersion',{
        name:data.name,
        checksum
    })
    const new_version=result.version

    await new Promise(function(res,rej){
        next(100)

        async function next(count){
            const tmp=await run("getBot",{
                name:data.name,
                versionOrAlias:new_version
            })
            if(count===0){
                throw "build timeout"
            }else if(tmp.status==="READY"){
                res() 
            }else if(tmp.status==="BUILDING"){
                await Promise.delay(5000)
                next(--count)
            }else{
                throw tmp
            }
        }
    })

    return new_version 
}

