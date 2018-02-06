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
var exists=require('./util').exists
var run=require('./util').run
var api=require('./util').api

module.exports={
    root:{
        get:test=>{
            api({
                path:"/",
                method:"get"
            })
            .tap(console.log)
            .tap(test.ok)
            .then(function(result){
                return Promise.all(_.values(result._links).map(x=>api({
                    href:x.href,
                    method:"get"
                }).tap(test.ok).catch(test.ifError)
                ))
            })
            .catch(test.ifError)
            .finally(()=>test.done())
        }
    },
    bot:{
        get:test=>{
            api({
                path:"bot",
                method:"get"
            })
            .tap(console.log)
            .tap(test.ok)
            .then(function(result){
                return Promise.all(_.values(result._links).map(x=>api({
                    href:x.href,
                    method:"get"
                }).tap(test.ok).catch(test.ifError)
                ))
            })
            .catch(test.ifError)
            .finally(()=>test.done())
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
        },test),
        error:test=>run({
            path:"static/notHere.html",
            method:"head"
        },test,false)
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
    examples:{
        documents:async test=>{
            var exampleHrefs=await api({
                path:"examples",
                method:"get"
            })
           
            var documents=await api({
                href:exampleHrefs._links.documents.href,
                method:"get"
            })
            await Promise.all(
                documents.examples.map(x=>{
                    return api({
                        href:x.document.href,
                        method:"get"
                    })
                })
            )
            test.done()    
        },
        photos:async test=>{
            var exampleHrefs=await api({
                path:"examples",
                method:"get"
            })
           
            var photos=await api({
                href:exampleHrefs._links.photos.href,
                method:"get"
            })
            await Promise.all(
                photos.photos.map(href=>{
                    return api({
                        href,
                        method:"get"
                    })
                })
            )
            test.done()    
        }
    },
    jobs:{
        get:test=>{
            api({
                path:"/jobs",
                method:"get"
            })
            .tap(console.log)
            .tap(test.ok)
            .then(function(result){
                return Promise.all(_.values(result._links).map(x=>api({
                    href:x.href,
                    method:"get"
                }).tap(test.ok).catch(test.ifError)
                ))
            })
            .catch(test.ifError)
            .finally(()=>test.done())
        }
    }
}

