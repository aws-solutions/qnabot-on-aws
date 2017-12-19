var fs=require('fs')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');

exports.run=function(name,context,test){
    var temp=new Velocity.Engine({
        template:"./"+name+".vm",
        debug:true
    })
    
    var result=temp.render(Object.assign(require("./context.js"),context))
    console.log(result)
    try {
        var json=JSON.parse(result)
        test.ok(true)
        test.done()
    } catch (e){
        console.log(e)
        test.ok(false)
        test.done()
    }
}

exports.input=function(body){
        return {
            input:{
                path:(x)=>{
                    return JSONPath({json:body,path:x})[0]
                },
                json:(x)=>{
                    return JSON.stringify(JSONPath({json:body,path:x})[0])
                }
            }
        }

}
