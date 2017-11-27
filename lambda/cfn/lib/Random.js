var Promise=require('./util/promise')
var crypto=Promise.promisifyAll(require('crypto'))
var aws=require('./util/aws')

module.exports=class CognitoUser extends require('./base') {
    constructor(){
        super()
    }

    Create(params,reply){
        crypto.randomBytesAsync(params.Bytes||512)
        .then(x=>x.toString('base64'))
        .then(x=>reply(null,"Random",{Result:x}))
        .catch(reply)
    }
}
