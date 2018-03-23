from __future__ import print_function
import json
import boto3
import os
import botocore.response as br

def handler(event, context):

    #uncomment below if you want to see the JSON that is being passed to the Lambda Function
    # jsondump = json.dumps(event)
    # print(jsondump)

    qid = None
    try:
        #get the Question ID (qid) of the previous document that was returned to the web client 
        stringToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
        qid = stringToJson["qid"]
    except:
        #replace qid with the String 'Empty' if there is no previous questions that have been asked
        qid = ""
    # if this the case, we aren't in any guided navigation sequence, so return the list of Guided Navigations Document   

    if qid != "":
        client = boto3.client('lambda')
        #Invoke the prepackaged function that Queries ElasticSearch using a document qid
        resp = client.invoke(
            FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
            Payload = json.dumps({'qid':qid,'type':"next"}),
            InvocationType = "RequestResponse"
        )
        # Because the payload is of a streamable type object, we must explicitly read it and load JSON 
        response = json.loads(resp['Payload'].read())
        #uncomment below if you want to see the response 
        #print(json.dumps(response))
        if 'a' in response:
            event = updateResult(event,response)
                # modify the event to make the previous question the redirected question that was just asked instead of "Next Question"
        else:
            #if unable to find anything, set the previous attribute back to the document qid that was previously returned
            event["res"]["session"]["previous"] = {'qid': qid , 'a': stringToJson["a"],'q':stringToJson["q"]}
        #uncomment line below if you want to see the final JSON before it is returned to the client
        # print(json.dumps(event))
    else:
        event["res"]["session"]["previous"] = {'qid': qid , 'a': stringToJson["a"],'q':stringToJson["q"]}

    return event

#update the event with the information from the new Query
def updateResult(event, response):
    event["res"]["result"] = response
    event["res"]["type"] = "PlainText"
    event["res"]["message"] = response["a"]
    if "r" in response:
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
                if 'imageUrl' in card:
                    event["res"]["card"]["imageUrl"] = card["imageUrl"]
    if 't' in response:
        event["res"]["session"]["topic"] = response["t"]
    event["res"]["session"]["previous"] = json.dumps({'qid':response["qid"], 'a': response["a"], 'q':event["req"]["question"]})   
    return event

