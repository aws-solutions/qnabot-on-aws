var Promise=require('./util/promise')
var aws=require('./util/aws')
var cognito=new aws.CognitoIdentityServiceProvider()
var crypto=Promise.promisifyAll(require('crypto'))

module.exports=class CognitoDomain extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        var domain=generate(12)
        
        cognito.createUserPoolDomain({
            Domain:domain,
            UserPoolId:params.UserPool
        }).promise()
        .then(()=>reply(null,domain,{}))
        .catch(reply)
    }
    
    Update(ID,params,oldparams,reply){
        this.Create(params,reply) 
    }
   
    Delete(ID,params,reply){
        cognito.deleteUserPoolDomain({
            Domain:ID,
            UserPoolId:params.UserPool
        }).promise()
        .then(()=>reply(null,ID))
        .catch(reply)
    }
}


function generate(n) {
        var add = 1, max = 12 - add;    
        if ( n > max ) {
        	return generate(max) + generate(n - max);
        }
        max        = Math.pow(10, n+add);
        var min    = max/10; // Math.pow(10, n) basically
        var number = Math.floor( Math.random() * (max - min + 1) ) + min;
        return ("" + number).substring(add); 
}
