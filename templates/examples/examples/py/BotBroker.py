from __future__ import print_function
import json
import string
import boto3
import time
import hashlib
import os
import collections
from collections import defaultdict
import botocore.response as br
import datetime


def handler(event, context):

    #uncomment below if you want to see the JSON that is being passed to the Lambda Function
    # jsondump = json.dumps(event)
    # print(jsondump)
    
    #the utterances to exit the bot broker 
    exitResponses={'quit','exit','return'}
    currentUtterance = event["req"]["question"].lower()
    print (currentUtterance)
    if currentUtterance in exitResponses and "queryLambda" in event["res"]["session"]:
        event["res"]["session"].pop("queryLambda",None)
        event["res"]["session"].pop("botName",None)
        event["res"]["session"].pop("botAlias",None)
        event["res"]["session"].pop("brokerUID",None)
        plaintextResp = 'Welcome back to QnABot!!!'
        htmlResp = '<i> Welcome back to QnABot!!! </i>'
        event["res"]["message"] = '{0}'.format(plaintextResp)
        event["res"]["session"]["appContext"]={"altMessages":{"html":htmlResp}}
    # return the default message telling the user that we are taking them to a partner bot
    elif "queryLambda" not in event["res"]["session"]:
        return middleman(event,True)
    else:
        return middleman(event,False)

    return event

#handle the brokerage between Lex bots
def middleman(event, initialConnection):
    lexClient = boto3.client('lex-runtime')
    
    sessionAttrib = {}
    #for Lex
    if "sessionAttributes" in event["req"]["_event"]:
        sessionAttrib = event["req"]["_event"].get("sessionAttributes",{})
    #for Alexa
    else:
        sessionAttrib = event["req"]["_event"].get("session").get("attributes", {})
    
    tempBotName = sessionAttrib.get("botName" , None)
    tempBotAlias = sessionAttrib.get("botAlias", None)
    tempBotUserID = sessionAttrib.get("brokerUID", None)

    if tempBotName == None:
        tempBotName = event["res"]["result"]["args"][0]
        tempBotAlias = event["res"]["result"]["args"][1]
        #userID location varies based on whether Lex or Alexa
        tempBotUserID = event["req"]["_event"].get("userId") or event["req"]["_event"]["session"]["sessionId"]
        if not(len(event["res"]["result"]["args"]) < 3 or event["res"]["result"]["args"][2].lower() == "remember"):
            tempBotUserID ='{0}{1}'.format(tempBotUserID,int(round(time.time() * 1000)))
    print (tempBotUserID) 
    if not initialConnection:
        #if we don't unset the queryLambda here and we call another QnABot, we will run into a processing error and an infinite loop of Lambda calls
        sessionAttrib.pop("queryLambda",None)
        response = lexClient.post_text(
            botName = tempBotName,
            botAlias = tempBotAlias,
            userId= tempBotUserID,
            sessionAttributes= sessionAttrib,
            inputText=event["req"]["question"]
        )
        print (json.dumps(response))
        if "dialogState" in response:
            event["res"]["type"] = response.get("messageFormat", "PlainText")
            event["res"]["session"] = response["sessionAttributes"]
            if "message" in response:
                event["res"]["message"] = response["message"]
                event["res"]["plainMessage"]=response["message"]
            else:
                tempMessage = "Intent {0} is {1}:".format(response["intentName"], response["dialogState"])
                htmlMessage = tempMessage
                for slot in response["slots"]:
                    tempMessage += " {0}:{1}".format(slot,response["slots"][slot])
                    htmlMessage += "<br> {0}:{1}".format(slot,response["slots"][slot])
                event["res"]["message"] = tempMessage
                event["res"]["plainMessage"]= tempMessage
                event["res"]["session"]["appContext"]={"altMessages":{"html":htmlMessage}}
        if "responseCard" in response:
            card = response["responseCard"]["genericAttachments"][0]
            event["res"]["card"]["send"] = True
            for key,value in card.items():
                event["res"]["card"][key] = value
    if "botName" not in event["res"]["session"]:            
        event["res"]["session"]["botName"] = tempBotName
        event["res"]["session"]["botAlias"] = tempBotAlias
        event["res"]["session"]["brokerUID"] = tempBotUserID
    event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']            
    return event
    