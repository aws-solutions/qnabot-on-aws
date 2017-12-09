var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')

module.exports={
    health:test=>run("health",{},test),
    info:test=>run("info",{},test),
    bot:{
        get:test=>run("bot.get",{},test),
        post:test=>run("bot.post",{},test),
    },
    qa:{
        head:test=>run("qa.head",{
            input:{
                params:()=>'id'
            }
        },test),
        delete:test=>run("qa.delete",{
            input:{
                params:()=>'id'
            }
        },test),
        put:test=>run("qa.put",{
            input:{
                body:'{}'
            }
        },test)
    },
    root:{
        get:test=>run("qa.get",{
            input:{
                body:'{}',
                params:name=>{return {
                    from:"all",
                    filter:"",
                    query:"",
                    perpage:""
                }[name]}
            }
        },test),
        list:test=>run("qa.get",{
            input:{
                body:'{}',
                params:name=>{return {
                    from:"",
                    filter:"filter",
                    query:"",
                    perpage:""
                }[name]}
            }
        },test),
        import:test=>run("qa.put",{
            input:{
                body:'{}',
                params:()=>'notall'
            }
        },test),
        search:test=>run("qa.get",{
            input:{
                body:'{}',
                params:name=>{return {
                    from:"",
                    filter:"",
                    query:"search",
                    perpage:"",
                    topic:""
                }[name] }
            }
        },test)
    }
}

function run(name,context,test){
    var temp=new Velocity.Engine({
        template:"./"+name+".vm",
        debug:true
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
