var response = require('cfn-response')
var aws=require('aws-sdk')
var fs=require('fs')
var handlebars = require('handlebars')

aws.config.region=process.env.AWS_REGION
var s3=new aws.S3()

exports.handler = function(event,context,cb) {
    console.log(JSON.stringify(event,null,2))

    try {
        if(event.RequestType!=="Delete"){
            var files=fs.readdirSync(`${__dirname}/content`)
            Promise.all(files.map(x=>{
                var name=x
                var temp_text=fs.readFileSync(`${__dirname}/content/${x}`,'utf-8')
                let text = temp_text
                // by parsing handlebars during an import of json, it rules out being able to import handlebar syntax.
                // the only know case of using handlebars to change content of an import is using {{photos}}
                // only run handlebars processing if {{photos}} is referenced. All other handlebars syntax should
                // just be imported as handlebars.
                if (temp_text.indexOf('{{photos}}') >= 0) {
                    const temp=handlebars.compile(temp_text)
                    text = temp(event.ResourceProperties)
                }
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


