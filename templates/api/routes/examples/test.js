var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input

module.exports={
    list:test=>run(__dirname+'/'+"list",input({
        perpage:100,
        token:""
    }),test),
    handler:async function(test){
        var output=await require('../../../../bin/exports')('dev/bucket')
        try{
            require('./handler').handler({
                bucket:output.Bucket,
                prefix:"",
                root:"example.com"
            },{},function(err,result){
                console.log(result)
                test.ifError(err)
                test.ok(result)
                test.done()
            })
        }catch(e){
            test.ifError(e)
            test.done()
        }
    }
}


