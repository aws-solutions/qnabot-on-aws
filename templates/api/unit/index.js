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
    proxyEs:require('../proxy-es/test'),
    proxyLex:require('../proxy-lex/test'),
    templates:require('../routes/test'),
    routes:require('./routes'),
    workflows:require('./workflows'),
    lex:require('./lex')
}

