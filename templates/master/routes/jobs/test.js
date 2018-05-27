var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input
var env=require('../../../../bin/exports')()

module.exports={
    info:test=>run(__dirname+'/'+"info",{},test),
    start:test=>run(__dirname+'/'+"export-start",{},test),
    listExports:test=>run(__dirname+'/'+"list-export",{
        perpage:100,
        token:""
    },test),
    list:test=>run(__dirname+'/'+"list",input({
        perpage:100,
        token:""
    }),test)
}


