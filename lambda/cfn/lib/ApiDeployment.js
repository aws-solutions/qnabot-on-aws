var aws=require('./util/aws')
var api=new aws.APIGateway()
var _=require('lodash')
module.exports=class CognitoUser {
    Create(params,reply){
        api.createDeployment(_.omit(params,["buildDate","stage"])).promise()
        .tap(console.log)
        .then(x=>reply(null,x.id))
        .catch(reply)
    }

    Update(ID,params,oldparams,reply){
        var self=this
        self.Create(params,function(error,id){
            console.log("created:"+id)
            if(error){
                reply(error)
            }else{
                api.updateStage({
                    restApiId:params.restApiId,
                    stageName:params.stage,
                    patchOperations:[{
                        op:"replace",
                        path:"/deploymentId",
                        value:id
                    }]
                }).promise()
                .then(()=>reply(null,id)) 
                .catch(reply)
            }
        })
    }
    
    Delete(ID,params,reply){
        api.deleteDeployment({
            deploymentId:ID,
            restApiId:params.restApiId
        }).promise()
        .finally(x=>reply(null,ID))
    }
 }
