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
                    count===0 ? rej("Error:Timeout") : setTimeout(()=>next(--count),500)
                }else if(err.code==="ResourceInUseException"){
                    count===0 ? rej("Error:Timeout") : setTimeout(()=>next(--count),500)
                }else if(err.code==="LimitExceededException"){
                    setTimeout(()=>next(count),4000)
                }else{
                    rej("Error:"+err.code+':'+err.message)
                }
            })
        }
        next(200)
    })
}

module.exports=function(params,es){ 
    return run('getBot',{
        name:process.env.LEX_BOT,
        versionOrAlias:"$LATEST"
    }).get('status')
}


