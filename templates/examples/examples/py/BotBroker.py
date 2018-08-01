from __future__ import print_function
import json
import string
import boto3
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
    exitResponses={'quit','exit'}
    currentUtterance = event["req"]["question"].lower()
    print (currentUtterance)
    if currentUtterance in exitResponses and "queryLambda" in event["res"]["session"]:
        event["res"]["session"].pop("queryLambda",None)
        event["res"]["session"].pop("botName",None)
        event["res"]["session"].pop("botAlias",None)
        plaintextResp = 'Welcome back to QnABot!!!'
        htmlResp = '<i> Welcome back to QnABot!!! </i>'
        event["res"]["message"] = '{0}'.format(plaintextResp)
        event["res"]["session"]["appContext"]={"altMessages":{"html":htmlResp}}
    else:
        return middleman(event)

    return event

#handle the brokerage between Lex bots
def middleman(event):
    lexClient = boto3.client('lex-runtime')
    tempBotName = event["req"]["_event"].get("sessionAttributes").get("botName" , None)
    tempBotAlias = event["req"]["_event"].get("sessionAttributes").get("botAlias", None)
    if tempBotName == None:
        tempBotName = event["res"]["result"]["args"][0]
        tempBotAlias = event["res"]["result"]["args"][1]
    response = lexClient.post_text(
        botName = tempBotName,
        botAlias = tempBotAlias,
        userId= event["req"]["_event"]["userId"],
        sessionAttributes= event["req"]["_event"]["sessionAttributes"],
        inputText=event["req"]["question"]
    )
    
    if "message" in response:
        event["res"]["type"] = response["messageFormat"]
        event["res"]["message"] = response["message"]
        event["res"]["plainMessage"]=response["message"]
        event["res"]["session"] = response["sessionAttributes"]
        if "responseCard" in response:
            card = response["responseCard"]["genericAttachments"][0]
            event["res"]["card"]["send"] = True
            event["res"]["card"]["title"] = card["title"]
            try:
                event["res"]["card"]["text"] = card["text"]
            except:
                event["res"]["card"]["text"] = ""
            if 'subTitle' in card:
                event["res"]["card"]["subTitle"] = card["subTitle"]
            if 'imageUrl' in card:
                event["res"]["card"]["imageUrl"] = card["imageUrl"]
    if "botName" not in event["res"]["session"]:            
        event["res"]["session"]["botName"] = event["res"]["result"]["args"][0]
        event["res"]["session"]["botAlias"] = event["res"]["result"]["args"][1]
    event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']            
    return event
    