from __future__ import print_function
import json
import boto3
import os

def handler(event, context):

    #uncomment below if you want to see the JSON that is being passed to the Lambda Function
    #jsondump = json.dumps(event)
    #print(jsondump)
    
    # check we aren't calling this function before any document have been returned to the client and that 
    try:
        #Because "sub documents", like a sofa document that is connected to a room document, does not have a next, the in built query lambda attempts to figure out a parent document and will give the necessary information to perform room iteration
        #for Lex
        if "sessionAttributes" in event["req"]["_event"]:
            navigationToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["navigation"])
        #for Alexa
        else:
            navigationToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["navigation"])
    except KeyError as k:
        navigationToJson = {}
    qidList = navigationToJson.get("previous",[])
    
    
    # check that there aren't any previous rooms to go to
    if len(qidList) > 0:
        client = boto3.client('lambda')
        #Invoke the prepackaged function that Queries ElasticSearch using a document qid
        temp = qidList.pop()
        resp = client.invoke(
            FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
            Payload = json.dumps({'qid':temp,'type':"qid"}),
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
            event["res"]["session"]["previous"] ={"qid":qidList,"a":navigationToJson["a"],"q":navigationToJson["q"]}
            event["res"]["session"]["navigation"]={"next":navigationToJson["next"],"previous":[],"hasParent":navigationToJson["hasParent"]}

        #uncomment line below if you want to see the final JSON before it is returned to the client
        # print(json.dumps(event))
    # set the previous attribute back to the document qid that was previously returned since we don't want this document to be in history
   # else:
       # event["res"]["session"]["previous"] ={"qid":qidList,"a":navigationToJson["a"],"q":navigationToJson["q"],"next":navigationToJson["next"],"previous":[]}

    return event

#update the event with the information from the new Query
def updateResult(event, response):
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
                if 'buttons' in card:
                    event["res"]["card"]["buttons"] = card["buttons"]
    if 't' in response:
        event["res"]["session"]["topic"] = response["t"]
    #for Lex
    if "sessionAttributes" in event["req"]["_event"]:
        navigationToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["navigation"])
    #for Alexa
    else:
        navigationToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["navigation"])
    tempList= navigationToJson["previous"]
    #shift to remove previous function name from list
    tempList.pop()
    event["res"]["session"]["previous"] ={"qid":response["qid"],"a":response["a"],"alt":response.get("alt",{}),"q":event["req"]["question"]}
    event["res"]["session"]["navigation"]={"next":response["next"],"previous":tempList,"hasParent":navigationToJson["hasParent"]}

    # Do not call lambdafunction from the previous item if the link actually points to this previous function
    if 'l' in response and response["l"].find(os.environ.get('AWS_LAMBDA_FUNCTION_NAME'))<=0:
        event["res"]["result"]["args"] = response["args"]
        client = boto3.client('lambda')
        lhresp = client.invoke(
            FunctionName = response["l"],
            Payload = json.dumps(event),
            InvocationType = "RequestResponse"
        )
        # Because the payload is of a streamable type object, we must explicitly read it and load JSON
        event = json.loads(lhresp['Payload'].read())

    return event

