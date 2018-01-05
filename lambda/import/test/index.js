var config=require('../../../config')
process.env.STRIDE="10000"
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
process.env.AWS_REGION=config.region

var env=require('../../../bin/exports')()
var Promise=require('bluebird')
var aws=require("aws-sdk")
aws.config.region=config.region
var fs=require('fs')
var handler=Promise.promisifyAll(require('../index'),{multiArgs:true})
var gen=require('../gen')

module.exports={
    test:function(test){
        gen().then(()=>env.tap(envs=>handler.startAsync({
            Records:[{
                s3:{
                    object:{key:"import/bulk-test"},
                    bucket:{name:envs["QNA-DEV-BUCKET"]}
                }
            }]
        },null)))
        .delay(1000)
        .tap(envs=>{
            process.env.ES_PROXY=envs["QNA-DEV-LAMBDA"]
            process.env.ES_TYPE="qna"
            process.env.ES_INDEX="qna"
        })
        .delay(1000)
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
