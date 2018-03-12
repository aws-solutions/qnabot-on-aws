var config=require('../../../../config')
process.env.AWS_REGION=config.region

module.exports=function(type,stage,properties){
    return {
        "StackId": "stackid",
        "ResponseURL": "https://localhost:8000",
        "ResourceProperties": properties,
        "RequestType": stage,
        "ResourceType": "Custom::"+type,
        "RequestId": "unique id for this create request",
        "LogicalResourceId": "MyTestResource"
    }
}
