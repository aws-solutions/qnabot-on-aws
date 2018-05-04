var aws=require('aws-sdk')
aws.config.region=process.env.AWS_REGION
var lex=new aws.LexModelBuildingService()

exports.handler = (event, context, callback) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    lex[event.fnc](event.params).promise()
    .then(function(x){
        console.log("Response: "+JSON.stringify(x,null,2))
        callback(null,x)
    })
    .catch(function(y){
        console.log("Error: "+y)
        callback(JSON.stringify({
            type:"[InternalServiceError]",
            data:y
        }))
    })
};

