var resource=require('../util/resource')
var lambda=require('../util/lambda')
var fs=require('fs')

module.exports={
    "Health": resource('health'),
    "HealthGet":lambda({
        method:'get',
        lambda:{"Fn::GetAtt":["ESProxyLambda","Arn"]},
        template:fs.readFileSync(__dirname+"/health.vm",'utf8'),
        responseTemplate:fs.readFileSync(__dirname+'/health.resp.vm','utf8'),
        resource:{"Ref":'Health'}
    })
}
    
