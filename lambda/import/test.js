var config=require('../../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region

var env=require('../../../bin/exports')()
var Promise=require('bluebird')
var aws=require("aws-sdk")
var fs=require('fs')
var handler=Promise.promisifyAll(require('./handler'),{multiArgs:true})

module.exports={
    test:function(test){
        env.tap(envs=>handler.startAsync({
            Records:[{
                s3:{
                    object:{key:"import/bulk-test"},
                    bucket:{name:envs["QNA-DEV-BUCKET"]}
                }
            }]
        },null))
        .tap(envs=>{
            process.env.ES_PROXY=envs["QNA-DEV-LAMBDA"]
            process.env.ES_TYPE="qna"
            process.env.ES_INDEX="qna"
        })
        .tap(envs=>handler.stepAsync({
            Records:[{
                s3:{
                    object:{key:"status/bulk-test"},
                    bucket:{name:envs["QNA-DEV-BUCKET"]}
                }
            }]
        },null))
        .delay(1000)
        .then(envs=>handler.stepAsync({
            Records:[{
                s3:{
                    object:{key:"status/bulk-test"},
                    bucket:{name:envs["QNA-DEV-BUCKET"]}
                }
            }]
        },null))
        .catch(test.ifError)
        .finally(()=>test.done())
    }
}
