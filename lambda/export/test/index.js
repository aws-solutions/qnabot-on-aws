var config=require('../../../config')
process.env.STRIDE="10000"
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
process.env.AWS_REGION=config.region

var outputs=require('../../../bin/exports')
var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.region=config.region
var fs=require('fs')
var handler=Promise.promisifyAll(require('../index'),{multiArgs:true})
var gen=require('./gen')

module.exports={
    test:function(test){
        gen().then(()=>Promise.join(
            outputs('dev/bucket').get('Bucket'),
            outputs('dev/master')
        )).tap(console.log).spread(function(bucket,master){
            process.env.ES_ENDPOINT=master.ElasticsearchEndpoint
            process.env.ES_PROXY=master.ESProxyLambda
            process.env.ES_TYPE=master.ElasticsearchType
            process.env.ES_INDEX=master.ElasticsearchIndex
            
            return handler.startAsync({
                Records:[{
                    s3:{
                        object:{key:"import/bulk-test"},
                        bucket:{name:bucket}
                    }
                }]
            },null)
            .delay(1000)
            .then(()=>handler.stepAsync({
                Records:[{
                    s3:{
                        object:{key:"status/bulk-test"},
                        bucket:{name:bucket}
                    }
                }]
            },null))    
            .delay(1000)
            .then(()=>handler.stepAsync({
                Records:[{
                    s3:{
                        object:{key:"status/bulk-test"},
                        bucket:{name:bucket}
                    }
                }]
            },null))    
        })
        .catch(test.ifError)
        .finally(()=>test.done())
    }
}
