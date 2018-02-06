var response = require('cfn-response')
var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var es=new aws.ES()

exports.handler = function(event, context) {
    console.log(JSON.stringify(event,null,2))

    if(event.RequestType!=="Delete"){
        es.describeElasticsearchDomain({
            DomainName:event.ResourceProperties.name
        }).promise()
        .then(info=>{
            response.send(event, context, response.SUCCESS,{
                Name:DomainStatus.DomainName,
                Arn:DomainStatus.ARN,
                Endpoint:DomainStatus.Endpoints
            })
        })
        .catch(x=>{
            console.log(x)
            response.send(event, context, response.FAILED)
        })
       
    }else{
        response.send(event, context, response.SUCCESS)
    }
}


