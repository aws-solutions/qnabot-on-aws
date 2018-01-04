var aws=require('./util/aws')
var Promise=require('./util/promise')
aws.config.maxRetries=10
var api=new aws.APIGateway()
var _=require('lodash')
module.exports=class CognitoUser {
    Create(params,reply){
        run(()=>api.createDeployment(
                _.omit(params,["buildDate","stage"])
            ).promise()
        )
        .tap(console.log)
        .then(x=>reply(null,x.id))
        .catch(reply)
    }

    Update(ID,params,oldparams,reply){
        var self=this
        new Promise(function(res,rej){
            self.Create(params,function(error,id){
                error ? rej(error) : setTimeout(()=>res(id),2000)
            })
        })
        .then(id=>run(()=>api.updateStage({
                restApiId:params.restApiId,
                stageName:params.stage,
                patchOperations:[{
                    op:"replace",
                    path:"/deploymentId",
                    value:id
                }]
            }).promise()
            .then(()=>id)
        ))
        .then(id=>reply(null,id)) 
        .catch(x=>{
            console.log(x)
            reply(x)
        })
        .catch(reply)
    }
    
    Delete(ID,params,reply){
        run(()=>api.deleteDeployment({
            deploymentId:ID,
            restApiId:params.restApiId
        }).promise())
        .finally(x=>reply(null,ID))
    }
 }


 function run(fnc){
    return new Promise(function(res,rej){
        console.log("starting")
        function next(count){
            console.log("tries left:"+count)
            if(count>0){
                fnc()
                .then(res)
                .catch(x=>x.statusCode===429,x=>{
                    console.log("retry in "+x.retryDelay)
                    setTimeout(()=>next(--count),x.retryDelay*1000)
                })
                .catch(rej)
            }else{
                rej("timeout")
            }
        }
        next(10)
    })
}
