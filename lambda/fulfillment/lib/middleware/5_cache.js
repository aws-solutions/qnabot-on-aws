var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')
var util=require('./util')

module.exports=async function cache(req,res){
    console.log("Entering Cache Middleware")
    console.log("response:" + JSON.stringify(res))
    if(_.has(res,"out.response")){
        res.out.sessionAttributes.cachedOutput= res.out.response
    }
    console.log("edited response:" + JSON.stringify(res))
    return {req,res}
}
