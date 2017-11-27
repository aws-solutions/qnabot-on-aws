var fs=require('fs')
var Velocity=require('velocity')

module.exports={
    health:{
        get:function(test){
            run("health",{},test)
        }
    },
    info:function(test){
        run("info",{},test)
    },
    client:function(test){
        run("client",{},test)
    }

}

function run(name,context,test){
    var temp=new Velocity.Engine({
        template:"./"+name+".vm"
    })
    var result=temp.render(Object.assign(require("./context.js"),context))
    console.log(result)
    try {
        var json=JSON.parse(result)
        var validator =new (require('jsonschema').Validator)();
        var v=validator.validate(json,require('./schema'))
        test.ok(v.valid,v)
        test.done()
    } catch (e){
        console.log(e)
        test.ok(false)
        test.done()
    }
}
