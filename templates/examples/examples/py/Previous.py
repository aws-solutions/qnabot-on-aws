from __future__ import print_function
import json
import boto3
import os

stackoutputs = None
stackname = os.getenv('CFSTACK')

def handler(event, context):

    jsondump = json.dumps(event)
    print(jsondump)
    
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

        # Do not call lambdafunction from the next item if the link points to ourselves
        function_name = response.get('l', '')
        if function_name != '' and function_name != 'QNA:ExamplePYTHONLambdaPrevious' and os.environ.get('AWS_LAMBDA_FUNCTION_NAME') not in function_name:
            # This update will pull in standard qid content into the eventual result passed back up the stack
            event = updateResult(event,response)
            if "args" in response:
                event["res"]["result"]["args"] = response["args"]
            client = boto3.client('lambda')
            targetname = response.get('l', '')
            if targetname.startswith('arn') != True:
                targetname = mapToArn(targetname, stackname)
            lhresp = client.invoke(
                FunctionName = targetname,
                Payload = json.dumps(event),
                InvocationType = "RequestResponse"
            )
            # Because the payload is of a streamable type object, we must explicitly read it and load JSON
            # Next merge in results of the LambdaHook execution
            event = updateLambdaHook(event,json.loads(lhresp['Payload'].read()),response)
        elif 'a' in response:
            # No lambda hook to call so just merge in content from the target question
            event = updateResult(event,response)
                # modify the event to make the previous question the redirected question that was just asked instead of "Next Question"
        else:
            event["res"]["session"]["previous"] ={"qid":qidList,"a":navigationToJson["a"],"q":navigationToJson["q"]}
            event["res"]["session"]["navigation"]={"next":navigationToJson["next"],"previous":[],"hasParent":navigationToJson["hasParent"]}

        #uncomment line below if you want to see the final JSON before it is returned to the client
        # print(json.dumps(event))

    return event

#maps a shortname to the full name via CF Output stack value
def mapToArn(name,stack):
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
def updateLambdaHook(event,hookEvent, response):
        #for Lex
    if "sessionAttributes" in event["req"]["_event"]:
        navigationToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["navigation"])
    #for Alexa
    else:
        navigationToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["navigation"])
    tempList= navigationToJson["previous"]
    #shift to remove previous function name from list
    tempList.pop()
    if "session" not in hookEvent["res"]:
        hookEvent["res"]["session"] = {}
    hookEvent["res"]["session"]["previous"] ={"qid":response["qid"],"a":response["a"],"alt":response.get("alt",{}),"q":event["req"]["question"]}
    hookEvent["res"]["session"]["navigation"]={"next":response["next"],"previous":tempList,"hasParent":navigationToJson["hasParent"]}
    return hookEvent



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

    return event

