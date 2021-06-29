var _=require('lodash');
var aws=require('../aws');
var lambda= new aws.Lambda();


exports.getLambdaArn=function(name){
    var match=name.match(/QNA:(.*)/)
    if(match){
        return process.env[match[1]] || name
    }else{
        return name
    }
}

exports.invokeLambda=async function(params){
    console.log(`Invoking ${params.FunctionName}`)
    var payload = params.Payload || JSON.stringify({
        req:params.req,
        res:params.res
    })
    console.log("payload")
    console.log(payload)
    var result=await lambda.invoke({
        FunctionName:params.FunctionName,
        InvocationType:params.InvocationType || "RequestResponse",
        Payload:payload
    }).promise() 
    
    console.log(result)
    if(!result.FunctionError){
        try{
            if(result.Payload){
                var parsed=JSON.parse(result.Payload)
                console.log("Response",JSON.stringify(parsed,null,2))
                return parsed
            }
        }catch(e){
            console.log(e)
            throw e
        }
    }else{
        switch(params.req._type){
            case 'LEX':
                var error_message = new LexError(_.get(params,'req._settings.ERRORMESSAGE',"Exception from Lambda Hook"));                
                break;
            case 'ALEXA':
                var error_message = new AlexaError(_.get(params,'req._settings.ERRORMESSAGE',"Exception from Lambda Hook"));
                break;
        }

        console.log("Error Response",JSON.stringify(error_message,null,2))
        throw error_message
    }
}

function Respond(message){
    this.action="RESPOND"
    this.message=message
}

function AlexaError(errormessage){
    this.action="RESPOND"
    this.message={
        version:'1.0',
        response:{
            outputSpeech:{
                type:"PlainText",
                text:errormessage
            },
            card: {
              type: "Simple",
              title: "Processing Error",
              content: errormessage
            },
            shouldEndSession:true
        }
    }
}

function LexError(errormessage) {
    this.action="RESPOND"
    this.message={
        dialogAction:{
            type:"Close",
            fulfillmentState:"Fulfilled",
            message: {
                contentType: "PlainText",
                content: errormessage
            }
        }
    }
}
