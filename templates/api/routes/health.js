var resource=require('./util/resource')
var lambda=require('./util/lambda')
var fs=require('fs')

module.exports={
    "Health": resource('health'),
    "HealthGet":lambda({
        method:'get',
        lambda:{"Ref": "HandlerArn"},
        template:fs.readFileSync(__dirname+"/templates/health.vm",'utf8'),
        resource:{"Ref":'Health'}
    })
}
    
