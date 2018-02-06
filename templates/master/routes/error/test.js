var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input

module.exports={
    error:{
        get:test=>run(__dirname+'/'+"error",
            input({errorMessage:JSON.stringify(
                {status:404,message:"aaa"}
            )})
        ,test),
    }
}


