var fs=require('fs')
var _=require('lodash')


var js=fs.readdirSync(`${__dirname}/examples/js`)
.filter(x=>x.match(/(.*).js/))
.map(file=>{
    var name=file.match(/(.*).js/)[1]
    return `ExampleJSLambda${name}`
})

var py=fs.readdirSync(`${__dirname}/examples/py`)
.filter(x=>x.match(/(.*).py/))
.map(file=>{
    var name=file.match(/(.*).py/)[1]
    return `ExamplePYTHONLambda${name}`
})

exports.names=py.concat(js)
exports.outputs=_.fromPairs(exports.names.map(x=>{
        return [x,{Value:{"Fn::GetAtt":[x,"Arn"]}}]
    }))



