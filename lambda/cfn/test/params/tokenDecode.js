var base=require('./base')
var Promise=require('bluebird')
var crypto=Promise.promisifyAll(require('crypto'))
var JWT=require('jsonwebtoken')

var setup=crypto.randomBytesAsync(256/8)
    .then(secret=>secret.toString("Base64"))
    .then(function(secret){
        var RegistrationKey=JWT.sign(
            {
                AccountId:123456,
                ApiUrl:"https://localhost:8000/register",
                Secret:secret,
                iterations:10000,
                size:512,
                algo:'sha512'
            },
            null,
            {algorithm:"none"}
        )
        return {
            token:RegistrationKey
        }
    })

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("TokenDecode",stage,param))
}
