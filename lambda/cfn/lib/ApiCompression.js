var aws=require('./util/aws')
var api=new aws.APIGateway()

module.exports=class CognitoUser {
    Create(params,reply){
        api.updateRestApi({
            restApiId:params.restApiId,
            patchOperations:[{
                op:"replace",
                path:"/minimumCompressionSize",
                value:params.value
            }]
        }).promise()
        .then(x=>reply(null,params.value))
        .catch(reply)
    }

    Update(ID,params,oldparams,reply){
        this.Create(params,reply) 
    }
    
    Delete(ID,params,reply){
        api.updateRestApi({
            restApiId:params.restApiId,
            patchOperations:[{
                op:"replace",
                path:"/minimumCompressionSize",
                value:null
            }]
        }).promise()
        .finally(x=>reply(null,params.value))
    }
 }
