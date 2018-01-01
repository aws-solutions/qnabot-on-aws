var config=require('../../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
var query=require('query-string').stringify
var _=require('lodash')
var zlib=require('zlib')
var Promise=require('bluebird')
var axios=require('axios')
var Url=require('url')
var sign=require('aws4').sign
var fs=require('fs')
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var env=require('../../../bin/exports')()
var exists=require('./util').exists
var run=require('./util').run
var api=require('./util').api

module.exports={
    root:{
        get:test=>run({
            path:"",
            method:"get"
        },test)
    },
    bot:{
        get:test=>run({
            path:"bot",
            method:"get"
        },test),
        alexa:{
            get:test=>run({
                path:"bot/alexa",
                method:"get"
            },test)
        },
        hooks:{
            get:test=>run({
                path:"bot/hooks",
                method:"get"
            },test),
            options:test=>run({
                path:"bot/hooks",
                method:"options"
            },test)
        },
        utterances:{
            get:test=>run({
                path:"bot/utterances",
                method:"get"
            },test)
        }
    },
    health:{
        get:test=>run({
            path:"health",
            method:"get"
        },test)
    },
    pages:{
         client:test=>run({
            path:"pages/client",
            method:"get"
        },test),
        designer:test=>run({
            path:"pages/designer",
            method:"get"
        },test)
    },
    static:{
        get:test=>run({
            path:"static/index.html",
            method:"get"
        },test),
        head:test=>run({
            path:"static/index.html",
            method:"head"
        },test)
    },
    qa:{
        list:test=>run({
            path:"questions",
            method:"get"
        },test),
        filter:test=>run({
            path:"questions?filter=who",
            method:"get"
        },test),
        search:test=>run({
            path:"questions?query=who",
            method:"get"
        },test),
        options:test=>run({
            path:"questions?",
            method:"options"
        },test)
    },
    jobs:{
        get:test=>run({
            path:"jobs",
            method:"get"
        },test)
    }
}

