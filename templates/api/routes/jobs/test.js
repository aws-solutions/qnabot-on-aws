var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input
var env=require('../../../../bin/exports')()

module.exports={
    info:test=>run(__dirname+'/'+"info",{},test),
    list:test=>run(__dirname+'/'+"list",input({
        perpage:100,
        token:""
    }),test),
    handler:function(test){
        env.then(function(envs){
            require('./handler').handler({
                bucket:envs["QNA-DEV-BUCKET"],
                prefix:"",
                root:"example.com"
            },{},function(err,result){
                console.log(result)
                test.ifError(err)
                test.ok(result)
                test.done()
            })
        })
    }
}


