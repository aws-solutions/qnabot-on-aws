module.exports=class CognitoUser {
    Create(params,reply){
        reply(null,"user",null)
    }

    Update(ID,params,oldparams,reply){
        reply(null,ID,null)
    }
    
    Delete(ID,params,reply){
        reply(null,ID,null)
    }
 }
