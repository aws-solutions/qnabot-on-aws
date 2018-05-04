var config=require('../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
var query=require('query-string').stringify
var _=require('lodash')
var Promise=require('bluebird')
var axios=require('axios')
var Url=require('url')
var sign=require('aws4').sign
var fs=require('fs')
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var outputs=require('../../bin/exports')


exports.api=api
function  api(opts){
    return outputs('dev/master',{wait:true}).then(function(output){
        var href=opts.path ? output.ApiEndpoint+'/'+opts.path : opts.href
        var url=Url.parse(href)
        var request={
            host:url.hostname,
            method:opts.method.toUpperCase(),
            url:url.href,
            path:url.path,
            headers:opts.headers || {}
        }
        if(opts.body){
            request.body=JSON.stringify(opts.body),
            request.data=opts.body,
            request.headers['content-type']='application/json'
        }

        var credentials=aws.config.credentials 
        var signed=sign(request,credentials)        
        delete request.headers["Host"]
        delete request.headers["Content-Length"]        
        
        return Promise.resolve(axios(signed))
        .get('data')
    })
}
