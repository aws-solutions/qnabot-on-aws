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
    
    # list of all the valid qids to be used for response feedback
    validResponseQid = collections.OrderedDict()
    validResponseQid.update({'A':'Correct and/or usefull?'})
    validResponseQid.update({'B':'Incorrect and/or not usefull?'})

    #the Qid to exit feedback without leaving feedback
    exitResponseQid={'C':'Cancel feedback'}
    previousQid = None
    previousQuestion = None
    previousAnswer = None
    #Information will be stored here when going into feedback mode because we are going through Elastic Search
    try:
        currentQid = event['res']['result']['qid']
    #Have to get information through the question when we bypass Elastic Search and go directly to this function (Not Ideal) 
    except:
        translator = str.maketrans('', '', string.punctuation)
        currentQid = event["req"]["question"].upper().translate(translator)
    try:
        #get the Question ID (qid) of the previous document that was returned to the web client 
        if "sessionAttributes" in event["req"]["_event"]:
            stringToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
        #for Alexa
        else:
            stringToJson = json.loads(event["req"]["_event"]["session"]["attributes"]["previous"])
        previousQid = stringToJson["qid"]
        previousQuestion = stringToJson["q"]
        previousAnswer = stringToJson["a"]
        previousAlt = stringToJson["alt"]
    except:
        #replace qid with the String '' if there is no previous questions that have been asked
        previousQid = ''
    #if there was no previous question, you can not leave feedback  
    if previousQid == '':
        msg = "There is no question to leave feedback on, please ask a question before attempting to leave feedback"
        event["res"]["message"] = msg
        #set the previous qid to be '' so that this response is returned again if client attempts to leave feedback without askign another question again
        event["res"]["session"]["previous"] = {'qid': '' , 'a': msg,'alt':msg,'q':event["req"]["question"]}
        #set back to normal mode if in feedback mode
        event["res"]["session"].pop("queryLambda",None)
    # if it is a valid response for leaving feedback
    elif currentQid in validResponseQid:
        logFeedback(previousQid,previousQuestion,previousAnswer,previousAlt,validResponseQid.get(currentQid))
        event["res"]["message"] = "Thank you for leaving the feedback."
        event["res"]["session"]["previous"] = {'qid': previousQid , 'a': previousAnswer, 'alt': previousAlt,'q': previousQuestion}
        #set back to normal mode if in feedback mode
        event["res"]["session"].pop("queryLambda",None)
    # if it is a valid exit response for feedback
    elif currentQid in exitResponseQid:
        event["res"]["message"] = "Canceled Feedback"
        event["res"]["session"]["previous"] = {'qid': previousQid , 'a': previousAnswer, 'alt': previousAlt,'q':previousQuestion}
        #set back to normal mode if in feedback mode
        event["res"]["session"].pop("queryLambda",None)
    #Give feedback options upon first call of feedback function or invalid response    
    else:
        defaultResp = [
            'Thank you for leaving feedback. Was the last answer:, "{0}" ?'.format(previousQuestion),
        ]
        htmlResp = [
            'Thank you for leaving feedback. Was the last answer:, <i>"{0}"</i> ?\n'.format(previousQuestion),
        ]
        #Append list of all valid responses
        htmlResp.append('<ul style="list-style-type:none";>')
        for key,value in validResponseQid.items():
            defaultResp.append('{0}. {1}'.format(key,value))
            htmlResp.append('<li><b>{0}.</b> {1}</li>'.format(key,value))
            
        #Append list of all exit responses
        for key,value in exitResponseQid.items():
            defaultResp.append('{0}. {1}'.format(key,value))
            htmlResp.append('<li><b>{0}.</b> {1}</li>'.format(key,value))
        #Send the the initial response for feedback options
        tempAnswerNormal = '\n'.join(defaultResp)
        tempAnswerHtml = '\n'.join(htmlResp)
        event["res"]["message"] = '{0}'.format(tempAnswerNormal)
        event["res"]["session"]["appContext"]={"altMessages":{"html":tempAnswerHtml}}
        #Make sure that the response triggers this lambda function by setting the session attribute
        event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']
        #set the qid and question of the previous as if this question had never been asked
        event["res"]["session"]["previous"] = {'qid': previousQid , 'a': previousAnswer, 'alt': previousAlt,'q': previousQuestion}
    return event

#logs feedback for the questions
def logFeedback(qid,question,answer,markdown, feedback):
    #uncomment below if you would like to see values passed in 
    jsonData = {"qid":"{0}".format(qid),
        "utterance":"{0}".format(question),
        "answer":"{0}".format(answer),
        "markdown":"{0}".format(markdown),
        "feedback":"{0}".format(feedback),
        "datetime":"{0}".format(datetime.datetime.now().isoformat())
    }
    jsondump=json.dumps(jsonData,ensure_ascii=False)
    client = boto3.client('firehose')
    response = client.put_record(
        DeliveryStreamName=os.environ['FIREHOSE_NAME'],
        Record={
            'Data': jsondump
        }
    )
    #uncomment below if you would like to see the response returned by the firehose stream
    #print(response)

