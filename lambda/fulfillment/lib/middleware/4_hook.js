var _=require('lodash')
var util=require('./util')

module.exports=async function hook(req,res){
    var arn=util.getLambdaArn(_.get(res.result,"l",""))
    
    if(arn){
        return await util.invokeLambda({
            FunctionName:arn,
            req,res
        })
    }else{
        return {req,res}
    }
}
