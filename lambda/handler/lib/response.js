/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/


exports.error=function(err,params){
    console.log(err)
    if(process.env.TYPE="API"){
        return JSON.stringify({error:err})
    }else if(process.env.TYPE="ALEXA"){
        return {
          "version": "1.0",
          "sessionAttributes": params.Session,
          "response": {
              "outputSpeech": {
                  "type": "PlainText",
                  "text": process.env.ERRORMESSAGE 
              },
              "shouldEndSession": true,
          }
      }   

    }else{
        return {
            sessionAttributes: params.Session,
            dialogAction: {
                type: "Close",
                fulfillmentState:"Failed",
                message:{
                    contentType:"PlainText",
                    content:process.env.ERRORMESSAGE
                }
            }
        }
    }
}

exports.success=function(message,params){
    console.log(process.env.TYPE,message)
    if(process.env.TYPE==="API"){
        return message
    }else if(process.env.TYPE==="ALEXA"){
        var out={
          "version": "1.0",
          "sessionAttributes":params.Session,
          "response": {
              "outputSpeech": {
                  "type": "PlainText",
                  "text": message.msg
              },
              "shouldEndSession": false,
              card:{
                type:"Standard",
                title:message.question,
                text:message.msg
              }
          }
        }
        if(message.r && message.r.imageUrl){
            out.response.card.image={largeImageUrl:message.r.imageUrl}
        }
        if(message.r && message.r.title){
            out.response.card.title=message.r.title
        }
        
        return out
    }else{ //lex
        var out={
            sessionAttributes: params.Session,
            dialogAction: {
                type: "Close",
                fulfillmentState:"Fulfilled",
                message:{
                    contentType:"PlainText",
                    content:message.msg
                }
            }
        }

        if( message.r && 
            Object.keys(message.r).length>0 &&
            Object.keys(message.r).map(x=>message.r[x].length>0).indexOf(false)===-1
        ){
            out['dialogAction']['responseCard'] = {
              "version":1,
              "contentType":"application/vnd.amazonaws.card.generic",
              "genericAttachments":[
                    message.r 
              ]
            }
            out['sessionAttributes']['appContext']=JSON.stringify({
               responseCard:out.dialogAction.responseCard
            })
        }
        return out
    }
}

