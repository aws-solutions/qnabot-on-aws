import json
import string
import boto3
import os
import collections
from collections import defaultdict
import botocore.response as br
import datetime

def handler(event, context):

    print(json.dumps(event))
    # event["res"]["session"]["previous"]["feedback"] = True

    
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
        feedbackArg = event["res"]["result"]["args"][0]
        print(feedbackArg)
        # - Check feedbackArg from the UI payload. Parse for "thumbs_down_arg" feedback. Based on user action, sendFeedback through SNS, and log in Firehose. 
        if (feedbackArg == "incorrect") :
            sendFeedbackNotification(previousQid,previousAnswer,previousQuestion, previousAlt, feedbackArg)
            logFeedback(previousQid,previousAnswer,previousQuestion, previousAlt, feedbackArg)
            print("Negative feedback logged, and SNS notification sent")
        else:
            logFeedback(previousQid,previousAnswer,previousQuestion, previousAlt, feedbackArg)
            print("Positive feedback logged")
    except Exception as e:
        print("Exception caught (no previous question?): ", e)
        print("Feedback not logged.")
    return event

#logs feedback for the questions
def logFeedback(qid,answer,question, alt, inputText):
     #uncomment below if you would like to see values passed in 
    jsonData = {"qid":"{0}".format(qid),
        "utterance":"{0}".format(question),
        "answer":"{0}".format(answer),
        "alternate":"{0}".format(alt),
        "feedback":"{0}".format(inputText),
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

# - Sends SNS notification for feedback.
def sendFeedbackNotification( qid,answer,question, alt, inputText):
    
    notificationBody = "\n\nTimestamp: {5} Question ID: {0}\nQuestion: {1} \nAnswer: {2} \nAlternative Answer: {3} \nFeedback: {4}".format(qid,question,answer, alt, inputText, datetime.datetime.now().isoformat())
   
    #print(notificationBody)
    message = {"qnabot": "publish to feedback topic"}
    client = boto3.client('sns')
    response = client.publish(
       
        TargetArn=  os.environ['SNS_TOPIC_ARN'], 
        Message=json.dumps({'default': notificationBody
        }),
        Subject='QnABot - Feedback received',
        MessageStructure='json'
    )