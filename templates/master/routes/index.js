var _=require('lodash')
exports.resources=Object.assign(
    require('./bot'),
    require('./health'),
    require('./root'),
    require('./qa'),
    require('./proxy'),
    require('./login'),
    require('./jobs'),
    require('./examples'),
    require('./services')
)

var out=[]
_.forEach(exports.resources,(value,key)=>{
    value.Type==='AWS::ApiGateway::Method' ? out.push(key) : null
})
exports.methods=out

