var response = require('cfn-response')
var aws=require('aws-sdk')
var fs=require('fs')
var handlebars = require('handlebars')

aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()

exports.handler = function(event, context,cb) {
    console.log(JSON.stringify(event,null,2))

    try {
        if(event.RequestType!=="Delete"){
            var files=fs.readdirSync(`${__dirname}/examples`)
            Promise.all(files.map(x=>{
                var name=x
                var temp_text=fs.readFileSync(`${__dirname}/examples/${x}`,'utf-8')
                var temp=handlebars.compile(temp_text)
                var text=temp(event.ResourceProperties)

                return s3.putObject({
                    Bucket:event.ResourceProperties.Bucket,
                    Key:`examples/documents/${name}`,
                    Body:text
                }).promise().tap(console.log)
            }))
            .then(()=>{
                if(event.ResponseURL){
                    response.send(event,context,response.SUCCESS)
                }else{
                    cb(null)
                }
            })
            .catch(e=>{
                console.log(e)
                response.send(event, context, response.FAIL)
            })
        }else{
            response.send(event, context, response.SUCCESS)
        }
    }catch(e){
        response.send(event, context, response.FAIL)
    }
}


