var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')
var util=require('./util')

module.exports=async function cache(req,res){
    console.log("Entering Cache Middleware")
    console.log("response:" + JSON.stringify(res))
    res.session.cachedOutput= res.response
    console.log("edited response:" + JSON.stringify(res))
    return {req,res}
}
