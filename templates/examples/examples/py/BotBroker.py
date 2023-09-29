######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################

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
    exit_responses={'quit','exit','return'}
    current_utterance = event["req"]["question"].lower()
    print (current_utterance)
    if current_utterance in exit_responses and "queryLambda" in event["res"]["session"]:
        event["res"]["session"].pop("queryLambda",None)
        event["res"]["session"].pop("botName",None)
        event["res"]["session"].pop("botAlias",None)
        event["res"]["session"].pop("brokerUID",None)
        plain_text_resp = 'Welcome back to QnABot!!!'
        html_resp = '<i> Welcome back to QnABot!!! </i>'
        event["res"]["message"] = '{0}'.format(plain_text_resp)
        event["res"]["session"]["appContext"]={"altMessages":{"html":html_resp}}
    # return the default message telling the user that we are taking them to a partner bot
    elif "queryLambda" not in event["res"]["session"]:
        return middleman(event,True)
    else:
        return middleman(event,False)

    return event

def build_event_from_response(event, response):
    if "dialogState" in response:
        event["res"]["type"] = response.get("messageFormat", "PlainText")
        event["res"]["session"] = response["sessionAttributes"]
        if "message" in response:
            event["res"]["message"] = response["message"]
            event["res"]["plainMessage"]=response["message"]
        else:
            temp_message = "Intent {0} is {1}:".format(response["intentName"], response["dialogState"])
            html_message = temp_message
            for slot in response["slots"]:
                temp_message += " {0}:{1}".format(slot,response["slots"][slot])
                html_message += "<br> {0}:{1}".format(slot,response["slots"][slot])
            event["res"]["message"] = temp_message
            event["res"]["plainMessage"]= temp_message
            event["res"]["session"]["appContext"]={"altMessages":{"html":html_message}}
    if "responseCard" in response:
        card = response["responseCard"]["genericAttachments"][0]
        event["res"]["card"]["send"] = True
        for key,value in card.items():
            event["res"]["card"][key] = value
    return event

#handle the brokerage between Lex bots
def middleman(event, initial_connection):
    lex_client = boto3.client('lex-runtime')
    
    session_attrib = {}
    #for Lex
    if "sessionAttributes" in event["req"]["_event"]:
        session_attrib = event["req"]["_event"].get("sessionAttributes",{})
    #for Alexa
    else:
        session_attrib = event["req"]["_event"].get("session").get("attributes", {})
    
    temp_bot_name = session_attrib.get("botName" , None)
    temp_bot_alias = session_attrib.get("botAlias", None)
    temp_bot_user_id = session_attrib.get("brokerUID", None)

    if temp_bot_name == None:
        temp_bot_name = event["res"]["result"]["args"][0]
        temp_bot_alias = event["res"]["result"]["args"][1]
        #userID location varies based on whether Lex or Alexa
        temp_bot_user_id = event["req"]["_event"].get("userId") or event["req"]["_event"]["session"]["sessionId"]
        if not(len(event["res"]["result"]["args"]) < 3 or event["res"]["result"]["args"][2].lower() == "remember"):
            temp_bot_user_id ='{0}{1}'.format(temp_bot_user_id,int(round(time.time() * 1000)))
    print (temp_bot_user_id) 
    if not initial_connection:
        #if we don't unset the queryLambda here and we call another QnABot, we will run into a processing error and an infinite loop of Lambda calls
        session_attrib.pop("queryLambda",None)
        response = lex_client.post_text(
            botName = temp_bot_name,
            botAlias = temp_bot_alias,
            userId= temp_bot_user_id,
            sessionAttributes= session_attrib,
            inputText=event["req"]["question"]
        )
        print (json.dumps(response))
        event = build_event_from_response(event, response)
    if "botName" not in event["res"]["session"]:
        event["res"]["session"]["botName"] = temp_bot_name
        event["res"]["session"]["botAlias"] = temp_bot_alias
        event["res"]["session"]["brokerUID"] = temp_bot_user_id
    event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']
    return event
