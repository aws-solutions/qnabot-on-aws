// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const Promise=require('bluebird')
const aws=require('./aws')
const lex=new aws.LexModelBuildingService()

module.exports=function run(fnc,params){
    console.log(fnc+':request:'+JSON.stringify(params,null,3))
    return new Promise(function(res,rej){
        const next=function(count){
            console.log("tries-left:"+count)
            const request=lex[fnc](params)
            request.promise()
            .tap(x=>console.log(fnc+':result:'+JSON.stringify(x,null,3)))
            .then(res)
            .catch(function(err){
                console.log(fnc+':'+err.code)
                const retry = err.retryDelay || 5
                console.log("retry in "+retry)

                if(err.code==="ConflictException"){
                    count===0 ? rej("Error") : setTimeout(()=>next(--count),retry*1000)
                }else if(err.code==="ResourceInUseException"){
                    count===0 ? rej("Error") : setTimeout(()=>next(--count),retry*1000)
                }else if(err.code==="LimitExceededException"){
                    setTimeout(()=>next(count),retry*1000)
                }else{
                    rej(err.code+':'+err.message)
                }
            })
        }
        next(200)
    })
}
