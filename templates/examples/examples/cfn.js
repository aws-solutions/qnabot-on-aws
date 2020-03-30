var response = require('cfn-response')
var aws=require('aws-sdk')
var fs=require('fs')

aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()

exports.handler = function(event, context,cb) {
    console.log(JSON.stringify(event,null,2))

    try {
        if(event.RequestType!=="Delete"){
            var files=fs.readdirSync(`${__dirname}/examples`)
            Promise.all(files.map(x=>{
                var name=x
                var text=fs.readFileSync(`${__dirname}/examples/${x}`,'utf-8')
                return s3.putObject({
                    Bucket:event.ResourceProperties.Bucket,
                    Key:`examples/documents/${name}`,
                    Body:text
                }).promise()
            }))
            .then(result=>{
                console.log(result)
                if(event.ResponseURL){
                    response.send(event,context,response.SUCCESS)
                }else{
                    cb(null)
                }
            })
            .catch(e=>{
                console.log(e)
                response.send(event, context, response.FAILED)
            })
        }else{
            response.send(event, context, response.SUCCESS)
        }
    }catch(e){
        console.log(e)
        response.send(event, context, response.FAILED)
    }
}


