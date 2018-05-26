var util=require('./util')
var _=require('lodash')

module.exports=async function preprocess(req,res){
    _.set(req,"_info.es.address",process.env.ES_ADDRESS)
    _.set(req,"_info.es.index",process.env.ES_INDEX)
    _.set(req,"_info.es.type",process.env.ES_TYPE)
    _.set(req,"_info.es.service.qid",process.env.ES_SERVICE_QID)
    _.set(req,"_info.es.service.proxy",process.env.ES_SERVICE_PROXY)
    
    if(process.env.LAMBDA_PREPROCESS){
        return await util.invokeLambda({
            FunctionName:process.env.LAMBDA_PREPROCESS,
            req,res
        })
    }else{
        return {req,res}
    }
}
