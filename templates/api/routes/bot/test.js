var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var JSONPath = require('JSONPath');
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input

module.exports={
    alexa:test=>run("alexa",{},test),
    get:test=>run("get",{},test),
    getresp:test=>run("get.resp",input({
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
    post:test=>run("post",{},test),
    resp:test=>run("post.resp",{},test),
    lambda:{
        getEmpty:test=>run("config.get",input({
            "Environment":null
        }),test),
        get:test=>run("config.get",input({
            "Environment":{
                LAMBDA_PREPROCESS:"arn",
                dontshow:""
            }
        }),test),
        put:test=>run("config.put",input({
            preprocess:"ar",
            log:"ad"
        }),test),
        options:test=>run("config.options",{},test)
    },
    utterance:{
        get:test=>run("utterance.get",{},test),
        resp:test=>run("utterance.get.resp",{
            input:{path:function(){
                return { enumerationValues:[
                    {value:"thin, or thin"},
                    {value:"thick"}
                ]}
            }}
        },test)
    }
}

