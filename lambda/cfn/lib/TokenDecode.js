var Promise=require('./util/promise')
var crypto=Promise.promisifyAll(require('crypto'))
var aws=require('./util/aws')
var JWT=require('jsonwebtoken')

module.exports=class TokenDecode extends require('./base') {
    constructor(){
        super()
    }

    Create(params,reply){
        var payload=JWT.decode(params.token,{complete:true}).payload
        console.log(payload)
        reply(null,"token",payload)
    }
}
