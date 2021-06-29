var fs=require('fs');
var _=require('lodash');

var js_example=fs.readdirSync(`${__dirname}/examples/js`)
.filter(x=>x.match(/(.*).js/))
.map(file=>{
    var name=file.match(/(.*).js/)[1]
    return `ExampleJSLambda${name}`
})
var py_example=fs.readdirSync(`${__dirname}/examples/py`)
.filter(x=>x.match(/(.*).py/))
.map(file=>{
    var name=file.match(/(.*).py/)[1]
    return `ExamplePYTHONLambda${name}`
})

var js_ext=fs.readdirSync(`${__dirname}/extensions/js_lambda_hooks`)
.map(name=>{
    return `EXT${name}`;
});

var py_ext=fs.readdirSync(`${__dirname}/extensions/py_lambda_hooks`)
.map(name=>{
    return `EXT${name}`;
});

exports.names=js_example.concat(py_example).concat(js_ext).concat(py_ext) ;


var out = _.fromPairs(exports.names.map(x=>{
    return [x,{Value:{"Fn::GetAtt":[x,"Arn"]}}];
}));


exports.outputs=out


