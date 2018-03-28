from __future__ import print_function
import json
import boto3
import os
import botocore.response as br

def handler(event, context):

    #uncomment below if you want to see the JSON that is being passed to the Lambda Function
    #jsondump = json.dumps(event)
    #print(jsondump)

    qid = None
    #Because "sub documents", like a sofa document that is connected to a room document, does not have a next, the in built query lambda attempts to figure out a parent document and will give the necessary information to perform room iteration
    stringToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
    qid = stringToJson.get("previous","")
    # check that we aren't calling this function before any document have been returned to the client
    if qid != "":
        #need to remove this function from the previous list
        print(qid.pop())
        client = boto3.client('lambda')
        #Invoke the prepackaged function that Queries ElasticSearch using a document qid
        resp = client.invoke(
            FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
            Payload = json.dumps({'qid':qid.pop(),'type':"next"}),
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
            event["res"]["session"]["previous"] ={"qid":qid,"a":stringToJson["a"],"q":stringToJson["q"],"next":stringToJson["next"],"previous":[]}

        #uncomment line below if you want to see the final JSON before it is returned to the client
        # print(json.dumps(event))
    # set the previous attribute back to the document qid that was previously returned since we don't want this document to be in history
    else:
        event["res"]["session"]["previous"] ={"qid":qid,"a":stringToJson["a"],"q":stringToJson["q"],"next":stringToJson["next"],"previous":[]}

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
    stringToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
    tempList= stringToJson["previous"]
    #pop twice to remove this function name and previous function name from list
    tempList.pop()
    event["res"]["session"]["previous"] ={"qid":response["qid"],"a":response["a"],"q":event["req"]["question"],"next":response["next"],"previous":tempList}

    return event

