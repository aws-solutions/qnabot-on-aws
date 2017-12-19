var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input

module.exports={
    health:{
        get:test=>run("health",{},test),
        resp:test=>run("health.resp",{},test),
    }
}


