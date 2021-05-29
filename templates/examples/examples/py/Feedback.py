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

    kendraIndexId = None
    kendraQueryId = None
    kendraResultId = None
    kendraResponsibleQid = None

    if event.get('req',{}).get('session',{}).get('qnabotcontext',{}).get('kendra'):
        kendraIndexId = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraIndexId')
        kendraQueryId = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraQueryId')
        kendraResultId = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraResultId')
        kendraResponsibleQid = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraResponsibleQid')
    else:
        print("no kendra information present in session attribute qnabotcontext")

    try:
        #get the Question ID (qid) of the previous document that was returned to the web client 
        previous = event["req"]["session"]["qnabotcontext"]["previous"]
        previousQid = previous["qid"] if "qid" in previous else "Answer via Kendra Fallback (no Qid matched)"
        previousQuestion = previous["q"]
        feedbackArg = event["res"]["result"]["args"][0]
        userInfo = event["req"]["_userInfo"]

        # - Check feedbackArg from the UI payload. Parse for "thumbs_down_arg" feedback. Based on user action, sendFeedback through SNS, and log in Firehose. 
        if feedbackArg == "incorrect":
            sendFeedbackNotification(previousQid, previousQuestion, feedbackArg, userInfo)
            if (kendraIndexId is not None) and (kendraResponsibleQid==previousQid or kendraResponsibleQid=='KendraFAQ'):
                print("submitting NOT_RELEVANT to Kendra Feedback")
                submitFeedbackForKendra(kendraIndexId, kendraQueryId, kendraResultId, "NOT_RELEVANT")
            logFeedback(previousQid, previousQuestion, feedbackArg, userInfo)
            print("Negative feedback logged, and SNS notification sent")
        else:
            if (kendraIndexId is not None) and (kendraResponsibleQid==previousQid or kendraResponsibleQid=='KendraFAQ'):
                print("submitting RELEVANT to Kendra Feedback")
                submitFeedbackForKendra(kendraIndexId, kendraQueryId, kendraResultId, "RELEVANT")
            logFeedback(previousQid, previousQuestion, feedbackArg, userInfo)
            print("Positive feedback logged")
    except Exception as e:
        print("Exception caught: ", e)
        print("Feedback not logged.")
    return event

#logs feedback for the questions
def logFeedback(qid, question, feedbackArg, userInfo):
    jsonData = {"qid":"{0}".format(qid),
        "utterance":"{0}".format(question),
        "feedback":"{0}".format(feedbackArg),
        "datetime":"{0}".format(datetime.datetime.now().isoformat()),
        "userInfo":userInfo
    }
    jsondump=json.dumps(jsonData,ensure_ascii=False)
    client = boto3.client('firehose')
    response = client.put_record(
        DeliveryStreamName=os.environ['FIREHOSE_NAME'],
        Record={
            'Data': jsondump
        }
    )
    print("Feedback logged via Firehose - response:", response)

# - Sends SNS notification for feedback.
def sendFeedbackNotification( qid, question, feedbackArg, userInfo):
    user = ""
    if ("GivenName" in userInfo):
        user += userInfo["GivenName"]
    if ("FamilyName" in userInfo):
        user += " " + userInfo["FamilyName"]  
    if ("Email" in userInfo):
        user += " <" + userInfo["Email"] + ">"
    stack = os.environ["CFSTACK"]
    if feedbackArg == "incorrect":
        message = "Negative feedback (Thumbs Down) received on QnABot answer:\n"
    else: 
        message = "Positive feedback (Thumbs Up) received on QnABot answer:\n"
    notificationBody = f"\n{message}\n\tTimestamp: {datetime.datetime.now().isoformat()} \n\tQuestion ID: {qid} \n\tQuestion: {question} \n\tUser: {user} \n\tFeedback: {feedbackArg}"
    print("Publishing SNS message: ", notificationBody)
    client = boto3.client('sns')
    response = client.publish(
        TargetArn=  os.environ['SNS_TOPIC_ARN'], 
        Message=json.dumps({'default': notificationBody
        }),
        Subject='QnABot - Feedback received',
        MessageStructure='json'
    )
    print("Feedback notification sent to SNS - response:", response)

# - Sends feedback notification for Kendra feedback.
def submitFeedbackForKendra(kendraIndexId, kendraQueryId, kendraResultId, kendraRelevancy):
    client = boto3.client('kendra')
    response = client.submit_feedback(
        IndexId=kendraIndexId,
        QueryId=kendraQueryId,
        RelevanceFeedbackItems=[
            {
                'ResultId': kendraResultId,
                'RelevanceValue': kendraRelevancy
            },
        ]
    )
    print("Feedback submitted to Kendra - response", response)
