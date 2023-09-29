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
import boto3
import os
import logging

stackoutputs = None
stackname = os.getenv('CFSTACK')

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):

    jsondump = json.dumps(event)
    print(jsondump)

    try:
        #Because "sub documents", like a sofa document that is connected to a room document, does not have a next, the in built query lambda attempts to figure out a parent document and will give the necessary information to perform room iteration
        previous_to_json = event["req"]["session"]["qnabotcontext"]["previous"]
        navigation_to_json = event["req"]["session"]["qnabotcontext"]["navigation"]
        qid = previous_to_json["qid"]
        next_doc = navigation_to_json["next"]
    except KeyError as k:
        # hit this case if user calls next on a client with no other answered phrases
        logger.info(k)
        event["res"]["session"]["qnabotcontext"]["previous"]={}
        event["res"]["session"]["qnabotcontext"]["navigation"]={}
        return event
    
    #for now we only go to the first document in list of next documents, change later when we add functionality for branching and converging paths
    if isinstance(next_doc,list):
        response = qid_lambda(event, next_doc[0])
    else:
        response = qid_lambda(event, next_doc)
    #uncomment below if you want to see the response 
    #print(json.dumps(response))

    # Do not call lambdafunction from the next item if the link points to ourselves
    function_name=response.get('l', '')
    if function_name != '' and function_name != 'QNA:ExamplePYTHONLambdaNext' and os.environ.get('AWS_LAMBDA_FUNCTION_NAME') not in function_name:
        # This update will pull in standard qid content into the eventual result passed back up the stack
        event = update_result(event,response)
        if "args" in response:
            event["res"]["result"]["args"] = response["args"]
        client = boto3.client('lambda')
        targetname = response.get('l', '')
        if targetname.startswith('arn') != True:
            targetname = map_to_arn(targetname, stackname)
        lhresp = client.invoke(
            FunctionName = targetname,
            Payload = json.dumps(event),
            InvocationType = "RequestResponse"
        )
        # Because the payload is of a streamable type object, we must explicitly read it and load JSON
        event = update_lambda_hook(event,json.loads(lhresp['Payload'].read()),response)
    elif 'a' in response:
        event = update_result(event, response)
        # No lambda hook to call so just merge in content from the target question(event,response)
        # modify the event to make the previous question the redirected question that was just asked instead of "Next Question"
    else:
        #if the response has no answer we must have hit the end of the guided navigation for this segment
        #if unable to find anything, set the previous attribute back to the document qid that was previously returned,since we don't want this document to be in history
        event["res"]["session"]["qnabotcontext"]["previous"]={"qid":qid,"q":previous_to_json["q"]}
        event["res"]["session"]["qnabotcontext"]["navigation"]={"next":navigation_to_json["next"],"previous":navigation_to_json["previous"],"hasParent":navigation_to_json["hasParent"]} 
    print(json.dumps(event))
    return event


#Invoke the prepackaged function that Queries ElasticSearch using a document qid
def qid_lambda(event,next_qid):
    client = boto3.client('lambda')
    #Invoke the prepackaged function that Queries ElasticSearch using a document qid
    resp = client.invoke(
        FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
        Payload = json.dumps({'qid':next_qid}),
        InvocationType = "RequestResponse"
    )
    # Because the payload is of a streamable type object, we must explicitly read it and load JSON 
    temp_response = resp['Payload'].read()
    print(temp_response)
    response = json.loads(temp_response)
    return response

#maps a shortname to the full name via CF Output stack value
def map_to_arn(name,stack):
    res = name
    global stackoutputs
    if stackoutputs is None:
        cf = boto3.client('cloudformation')
        r = cf.describe_stacks(StackName=stack)
        stack, = r['Stacks']
        stackoutputs = stack['Outputs']
    for o in stackoutputs:
        if name == 'QNA:' + o['OutputKey']:
            res = o['OutputValue']
            break
    return res

#update the event with the information if there is a Lambda hook
def update_lambda_hook(event,hook_event,response):
    previous_to_json = event["req"]["session"]["qnabotcontext"]["previous"]
    navigation_to_json = event["req"]["session"]["qnabotcontext"]["navigation"]
    #only append to navigation list if top level document or not returning the same document from before(if a document points to itself as the next document)
    temp_list= navigation_to_json["previous"]
    if not navigation_to_json["hasParent"]:
        if(len(temp_list) == 0):
            temp_list.append(previous_to_json["qid"])
        elif(temp_list[-1] != previous_to_json["qid"]):
            print(temp_list[-1])
            print(previous_to_json["qid"])
            temp_list.append(previous_to_json["qid"])
    if len(temp_list) > 10:
        #setting limit to 10 elements in previous stack since ,since lex has a max header size and we want to save that for other functions, same max size is set in the query lambda
        temp_list.pop(0)
    if "session" not in hook_event["res"]:
        hook_event["res"]["session"] = {}
    hook_event["res"]["session"]["qnabotcontext"]["previous"] ={"qid":response["qid"],"q":event["req"]["question"]}
    hook_event["res"]["session"]["qnabotcontext"]["navigation"]={"next":response.get("next",""),"previous":temp_list,"hasParent":False}
    return hook_event

def build_card_from_response(event, response):
    card = response["r"]
    if 'title' in card:
            #making sure that the title is not empty, as we don't want to be sending empty cards
        if card["title"]!="":
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
            if 'buttons' in card:
                event["res"]["card"]["buttons"] = card["buttons"]
    return event

#update the event with the information from the new Query
def update_result(event, response):
    event["res"]["result"] = response
    event["res"]["type"] = "PlainText"
    event["res"]["message"] = response["a"]
    event["res"]["plainMessage"]=response["a"]
    event["res"]["session"]["appContext"]["altMessages"] = response.get("alt",{})

    if "outputDialogMode" not in event["req"] or event["req"]["outputDialogMode"]!="Text":
        if response.get("alt",False) and "ssml" in response["alt"] and len(response["alt"]["ssml"])>0:
            event["res"]["type"]="SSML"
            event["res"]["message"]=response["alt"]["ssml"].replace('\n',' ')
            
    if "r" in response:
        event = build_card_from_response(event, response)
    if 't' in response:
        event["res"]["session"]["topic"] = response["t"]

    previous_to_json = event["req"]["session"]["qnabotcontext"]["previous"]
    navigation_to_json = event["req"]["session"]["qnabotcontext"]["navigation"]
    temp_list= navigation_to_json["previous"]
    #only append to navigation list if top level document or not returning the same document from before(if a document points to itself as the next document)
    if not navigation_to_json["hasParent"]:
        if(len(temp_list) == 0):
            temp_list.append(previous_to_json["qid"])
        elif(temp_list[-1] != previous_to_json["qid"]):
            print(temp_list[-1])
            print(previous_to_json["qid"])
            temp_list.append(previous_to_json["qid"])
    if len(temp_list) > 10:
        #setting limit to 10 elements in previous stack since ,since lex has a max header size and we want to save that for other functions, same max size is set in the query lambda
        temp_list.pop(0)
    event["res"]["session"]["qnabotcontext"]["previous"] ={"qid":response["qid"],"q":event["req"]["question"]}
    event["res"]["session"]["qnabotcontext"]["navigation"]={"next":response.get("next",""),"previous":temp_list,"hasParent":False} 
    return event

