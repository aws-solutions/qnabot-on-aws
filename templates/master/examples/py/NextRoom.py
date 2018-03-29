from __future__ import print_function
import json
import boto3
import os
import botocore.response as br

def handler(event, context):

    #uncomment below if you want to see the JSON that is being passed to the Lambda Function
    # jsondump = json.dumps(event)
    # print(jsondump)

    try:
        #Because "sub documents", like a sofa document that is connected to a room document, does not have a next, the in built query lambda attempts to figure out a parent document and will give the necessary information to perform room iteration
        stringToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
        qid = stringToJson["qid"]
        nextDoc = stringToJson["next"]
    except KeyError as k:
        # hit this case if user calls next on a client with no other answered phrases
        event["res"]["session"]["previous"]={}
        return event
    
    
    #for now we only go to the first document in list of next documents, change later when we add functionality for branching and converging paths
    if isinstance(nextDoc,list):
        response = qidLambda(event, nextDoc[0])
    else:
        response = qidLambda(event, nextDoc)
    #uncomment below if you want to see the response 
    #print(json.dumps(response))

    #if the response has no answer we must have hit the end of the guided navigation for this segment
    if 'a' in response:
        event = updateResult(event,response)
            # modify the event to make the previous question the redirected question that was just asked instead of "Next Question"
    else:
        #if unable to find anything, set the previous attribute back to the document qid that was previously returned,since we don't want this document to be in history
        tempList = stringToJson["previous"]
        event["res"]["session"]["previous"] ={"qid":qid,"a":stringToJson["a"],"q":stringToJson["q"],"next":stringToJson["next"],"previous":tempList}
    #uncomment line below if you want to see the final JSON before it is returned to the client
    # print(json.dumps(event))


    return event

#Invoke the prepackaged function that Queries ElasticSearch using a document qid
def qidLambda(event,nextQid):
    client = boto3.client('lambda')
    #Invoke the prepackaged function that Queries ElasticSearch using a document qid
    resp = client.invoke(
        FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
        Payload = json.dumps({'qid':nextQid}),
        InvocationType = "RequestResponse"
    )
    # Because the payload is of a streamable type object, we must explicitly read it and load JSON 
    response = json.loads(resp['Payload'].read())
    return response

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
    print(tempList)
    tempList.append(stringToJson["qid"])
    if len(tempList) > 10:
        #setting limit to 10 elements in previous stack since ,since lex has a max header size and we want to save that for other functions, same max size is set in the query lambda
        tempList.pop(0)
    print(tempList)
    event["res"]["session"]["previous"] ={"qid":response["qid"],"a":stringToJson["a"],"q":stringToJson["q"],"next":response["next"],"previous":tempList}
    return event, event

