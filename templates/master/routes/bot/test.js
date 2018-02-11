var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input

module.exports={
    alexa:test=>run(__dirname+"/alexa",{},test),
    get:test=>run(__dirname+"/get",{},test),
    getresp:test=>run(__dirname+'/'+"get.resp",input({
        status:'BUILDING',
        abortStatement:{
            messages:[
                {content:"2"},
                {content:"3"}
            ]
        },
        clarificationPrompt:{
            messages:[
                {content:"1"},
                {content:"4"},
            ]
        }
    }),test),
    post:test=>run(__dirname+'/'+"post",{},test),
    resp:test=>run(__dirname+'/'+"post.resp",{},test),
    utterance:{
        get:test=>run(__dirname+'/'+"utterance.get",{},test),
        resp:test=>run(__dirname+'/'+"utterance.get.resp",{
            input:{path:function(){
                return { enumerationValues:[
                    {value:"thin, or thin"},
                    {value:"thick"}
                ]}
            }}
        },test)
    }
}

