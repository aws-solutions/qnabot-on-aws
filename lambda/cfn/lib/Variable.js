var Promise=require('./util/promise')
var crypto=Promise.promisifyAll(require('crypto'))
var response=require('cfn-response')

module.exports=class Variable extends require('./base') {
    constructor(){
        super()
    }
    Create(params,reply){
        reply(null,id(params),params)
    }
    Update(ID,newparams,oldparams,reply){
        reply(null,id(newparams),newparams)
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

