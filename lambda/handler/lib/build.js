/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var aws=require('./aws')
var lex=new aws.LexModelBuildingService()
var getUtterances=require('./bot-info')

var run=function(fnc,params){
    console.log(fnc+':request:'+JSON.stringify(params,null,3))
    return new Promise(function(res,rej){
        var next=function(count){
            console.log("tries-left:"+count)
            var request=lex[fnc](params)
            request.promise()
            .tap(fnc+':result:'+console.log)
            .then(res)
            .catch(function(err){
                console.log(fnc+':'+err.code)
                if(err.code==="ConflictException"){
                    count===0 ? rej("Error") : setTimeout(()=>next(--count),500)
                }else if(err.code==="ResourceInUseException"){
                    count===0 ? rej("Error") : setTimeout(()=>next(--count),500)
                }else if(err.code==="LimitExceededException"){
                    setTimeout(()=>next(count),4000)
                }else{
                    rej(err.code+':'+err.message)
                }
            })
        }
        next(200)
    })
}

module.exports=function(params,es){ 
    var utterances=getUtterances(params,es).get('utterances')
    var slottype=run("getSlotType",{
        name:params.slottype,
        version:"$LATEST"
    })
    var intent=run("getIntent",{
        name:params.intent,
        version:"$LATEST"
    })
    var bot=run('getBot',{
        name:params.botname,
        versionOrAlias:"$LATEST"
    })
    .tap(console.log)

    var slottype_version=Promise.join(utterances,slottype)
    .spread(function(utterances,slottype){
        slottype.enumerationValues=utterances.map(x=>{return {value:x}})
        delete slottype.lastUpdatedDate
        delete slottype.createdDate
        delete slottype.version
        
        return run('putSlotType',slottype).get("checksum")
    })
    .then(function(checksum){
        return run('createSlotTypeVersion',{
            name:params.slottype,
            checksum
        }).get('version')
    })
    
    

    var intent_version=Promise.join(slottype_version,intent)
    .spread(function(version,result){
        result.slots[0].slotTypeVersion=version
        delete result.lastUpdatedDate
        delete result.version
        delete result.createdDate
        return run('putIntent',result).get('checksum')
    })
    .then(function(checksum){
        return run('createIntentVersion',{
            name:params.intent,
            checksum
        }).get('version')
    })
    
    return Promise.join(intent_version,bot,slottype_version)
    .spread(function(version,data){
        data.intents[0].intentVersion=version
        delete data.status
        delete data.failureReason
        delete data.lastUpdatedDate
        delete data.createdDate
        delete data.version

        return run('putBot',data).get('checksum')
    })
    .then(function(checksum){
        return run('createBotVersion',{
            name:params.botname
        }).tap(console.log)
    })
    .then(function(version){
        return run('getBotVersions',{
            name:params.botname
        }).get('bots')
        .filter(type=>["$LATEST",version].indexOf(type.version)===-1)
        .map(function(x){
            return run('deleteBotVersion',{
                name:params.botname,
                version:x.version 
            })
        })
    })
    .then(function(){
        return intent_version.then(function(version){
            return run('getIntentVersions',{
                name:params.intent,
            }).get('intents')
            .filter(type=>["$LATEST",version].indexOf(type.version)===-1)
            .map(function(x){
                return run('deleteIntentVersion',{
                    name:params.intent,
                    version:x.version 
                })
            })
        })
    })
    .then(function(){
        return slottype_version.then(function(version){
            console.log("version",version)
            return run('getSlotTypeVersions',{
                name:params.slottype
            }).get('slotTypes')
            .filter(type=>["$LATEST",version].indexOf(type.version)===-1)
            .map(function(x){
                return run('deleteSlotTypeVersion',{
                    name:params.slottype,
                    version:x.version 
                })
            })
        })
    })
    .return('success')
}


