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

var lex=new aws.LexModelBuildingService({
    params:{
        name:process.env.LEX_INTENT,
        version:"$LATEST"
    }
})

module.exports=function(params,es){
    var get=es.get({
        index: process.env.ES_INDEX,
        type: process.env.ES_TYPE,
        id:params.Id
    })
    .tap(console.log)
    .catch(()=>false)

    var ES=get.then(function(){
        return es.delete({
            index: process.env.ES_INDEX,
            type: process.env.ES_TYPE,
            refresh:"true",
            id:params.Id
        })
    })
    .catch(function(err){
        if(!err.body.found){
            return Promise.resolve("success")
        }else{
            return Promise.reject(err)
        }
    })
    /*
    var mutex=lock()    
    var LEX=Promise.join(
        lex.getIntent().promise().tap(console.log),
        get,
        mutex
    )
    .spread(function(result,info){
        if(!info)return "done"
        
        var old=info._source.q
        var new_uterances=result.sampleUtterances.filter(ut=>!old.includes(ut))
        result.sampleUtterances=new_uterances
        
        delete result.lastUpdatedDate
        delete result.createdDate
        delete result.version
        
        return lex.putIntent(result).promise()
    })
    .tap(console.log)
    .finally(()=>mutex.then(unlock=>unlock()))
    */   
    return Promise.join(ES,Promise.resolve()).tap(console.log)
        .return('success')
}


