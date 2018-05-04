var Promise=require('./util/promise')
var crypto=Promise.promisifyAll(require('crypto'))
var _=require('lodash')

module.exports=class Variable extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        _.forEach(params,function(value,key){
            console.log(key,value)
            if(typeof value==="object"){
                if(value.op==="toLowerCase"){
                    params[key]=value.value.toLowerCase()
                }
            }
        })
        reply(null,id(params),params)
    }
    Update(ID,params,oldparams,reply){
        this.Create(params,reply) 
    }

}

function id(params){
    console.log('Creating CFN variable: %j', params);
    
    var jsonString = JSON.stringify(params);
    var id = crypto
            .createHash('sha256')
            .update(jsonString)
            .digest('hex')

    return new Buffer(jsonString).toString('base64');
}

