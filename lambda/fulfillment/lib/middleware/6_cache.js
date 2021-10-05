var Promise=require('bluebird')
var lex=require('./lex')
var alexa=require('./alexa')
var _=require('lodash')
var util=require('./util')
const qnabot = require("qnabot/logging")


module.exports=async function cache(req,res){
    qnabot.log("Entering Cache Middleware")
    qnabot.log("response:" + JSON.stringify(res))
    if(_.has(res,"out.response")){
        res.out.sessionAttributes.cachedOutput= res.out.response
    }
    qnabot.log("edited response:" + JSON.stringify(res))
    return {req,res}
}
