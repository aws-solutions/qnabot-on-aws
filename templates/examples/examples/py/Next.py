from __future__ import print_function
import json
import boto3
import os

def handler(event, context):

    #uncomment below if you want to see the JSON that is being passed to the Lambda Function
    jsondump = json.dumps(event)
    print(jsondump)

    try:
        #Because "sub documents", like a sofa document that is connected to a room document, does not have a next, the in built query lambda attempts to figure out a parent document and will give the necessary information to perform room iteration
        #for Lex
        if "sessionAttributes" in event["req"]["_event"]:
            previousToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
            navigationToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["navigation"])
        #for Alexa
        else:
            previousToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["previous"])
            navigationToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["navigation"])
        qid = previousToJson["qid"]
        nextDoc = navigationToJson["next"]
    except KeyError as k:
        # hit this case if user calls next on a client with no other answered phrases
        event["res"]["session"]["previous"]={}
        event["res"]["session"]["navigation"]={}
        return event
    
    
    #for now we only go to the first document in list of next documents, change later when we add functionality for branching and converging paths
    if isinstance(nextDoc,list):
        response = qidLambda(event, nextDoc[0])
    else:
        response = qidLambda(event, nextDoc)
    #uncomment below if you want to see the response 
    #print(json.dumps(response))


    # Do not call lambdafunction from the next item if the link actually points to this next function
    if 'l' in response and response["l"].find(os.environ.get('AWS_LAMBDA_FUNCTION_NAME'))<=0:
        event["res"]["result"]["args"] = response["args"]
        client = boto3.client('lambda')
        lhresp = client.invoke(
            FunctionName = response["l"],
            Payload = json.dumps(event),
            InvocationType = "RequestResponse"
        )
        # Because the payload is of a streamable type object, we must explicitly read it and load JSON
        event = updateResult(event, json.loads(lhresp['Payload'].read()))
        event = updateNavigation(event,response)
    #if the response has no answer we must have hit the end of the guided navigation for this segment
    elif 'a' in response:
        event = updateResult(event,response)
        event = updateNavigation(event,response)
            # modify the event to make the previous question the redirected question that was just asked instead of "Next Question"
    else:
        #if unable to find anything, set the previous attribute back to the document qid that was previously returned,since we don't want this document to be in history
        event["res"]["session"]["previous"]={"qid":qid,"a":previousToJson["a"],"q":previousToJson["q"]}
        event["res"]["session"]["navigation"]={"next":navigationToJson["next"],"previous":navigationToJson["previous"],"hasParent":navigationToJson["hasParent"]} 
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
    tempResponse = resp['Payload'].read()
    print(tempResponse)
    response = json.loads(tempResponse)
    return response

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
                if 'subTitle' in card:
                    event["res"]["card"]["subTitle"] = card["subTitle"]
                if 'imageUrl' in card:
                    event["res"]["card"]["imageUrl"] = card["imageUrl"]
                if 'buttons' in card:
                    event["res"]["card"]["buttons"] = card["buttons"]
    if 't' in response:
        event["res"]["session"]["topic"] = response["t"]
    return event

#update the navigation session attributes based off original event
def updateNavigation(event, response):   
     #for Lex
    if "sessionAttributes" in event["req"]["_event"]:
        previousToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
        navigationToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["navigation"])
    #for Alexa
    else:
        previousToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["previous"])
        navigationToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["navigation"])
    tempList= navigationToJson["previous"]
    #only append to navigation list if top level document or not returning the same document from before(if a document points to itself as the next document)
    if not navigationToJson["hasParent"]:
        if(len(tempList) == 0):
            tempList.append(previousToJson["qid"])
        elif(tempList[-1] != previousToJson["qid"]):
            print(tempList[-1])
            print(previousToJson["qid"])
            tempList.append(previousToJson["qid"])
    if len(tempList) > 10:
        #setting limit to 10 elements in previous stack since ,since lex has a max header size and we want to save that for other functions, same max size is set in the query lambda
        tempList.pop(0)
    event["res"]["session"]["previous"] ={"qid":response["qid"],"a":previousToJson["a"],"alt":previousToJson.get("alt",{}),"q":event["req"]["question"]}
    event["res"]["session"]["navigation"]={"next":response.get("next",""),"previous":tempList,"hasParent":False} 
    return event

