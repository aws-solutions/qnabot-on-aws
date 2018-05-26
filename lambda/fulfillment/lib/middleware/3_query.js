var _=require('lodash')
var util=require('./util')

module.exports=async function query(req,res){
    var arn=util.getLambdaArn(
        _.get(req,"session.queryLambda",process.env.LAMBDA_DEFAULT_QUERY)
    )
    return await util.invokeLambda({
        FunctionName:arn,
        req,res
    })
}
