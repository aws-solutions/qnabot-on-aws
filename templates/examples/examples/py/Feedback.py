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

    kendra_index_id = None
    kendra_query_id = None
    kendra_result_id = None
    kendra_responsible_qid = None

    if event.get('req',{}).get('session',{}).get('qnabotcontext',{}).get('kendra'):
        kendra_index_id = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraIndexId')
        kendra_query_id = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraQueryId')
        kendra_result_id = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraResultId')
        kendra_responsible_qid = event.get('req').get('session').get('qnabotcontext').get('kendra').get('kendraResponsibleQid')
    else:
        print("no kendra information present in session attribute qnabotcontext")

    try:
        #get the Question ID (qid) of the previous document that was returned to the web client 
        previous = event["req"]["session"]["qnabotcontext"]["previous"]
        previous_qid = previous["qid"] if "qid" in previous else "Answer via Kendra Fallback (no Qid matched)"
        previous_question = previous["q"]
        feedback_arg = event["res"]["result"]["args"][0]
        user_info = event["req"]["_userInfo"]

        # - Check feedbackArg from the UI payload. Parse for "thumbs_down_arg" feedback. Based on user action, sendFeedback through SNS, and log in Firehose. 
        if feedback_arg == "incorrect":
            send_feedback_notification(previous_qid, previous_question, feedback_arg, user_info)
            if (kendra_index_id is not None) and (kendra_responsible_qid==previous_qid or kendra_responsible_qid=='KendraFAQ'):
                print("submitting NOT_RELEVANT to Kendra Feedback")
                submit_feedback_for_kendra(kendra_index_id, kendra_query_id, kendra_result_id, "NOT_RELEVANT")
            log_feedback(previous_qid, previous_question, feedback_arg, user_info)
            print("Negative feedback logged, and SNS notification sent")
        else:
            if (kendra_index_id is not None) and (kendra_responsible_qid==previous_qid or kendra_responsible_qid=='KendraFAQ'):
                print("submitting RELEVANT to Kendra Feedback")
                submit_feedback_for_kendra(kendra_index_id, kendra_query_id, kendra_result_id, "RELEVANT")
            log_feedback(previous_qid, previous_question, feedback_arg, user_info)
            print("Positive feedback logged")
    except Exception as e:
        print("Exception caught: ", e)
        print("Feedback not logged.")
    return event

#logs feedback for the questions
def log_feedback(qid, question, feedback_arg, user_info):
    json_data = {"qid":"{0}".format(qid),
        "utterance":"{0}".format(question),
        "feedback":"{0}".format(feedback_arg),
        "datetime":"{0}".format(datetime.datetime.now().isoformat()),
        "userInfo":user_info
    }
    jsondump=json.dumps(json_data,ensure_ascii=False)
    client = boto3.client('firehose')
    response = client.put_record(
        DeliveryStreamName=os.environ['FIREHOSE_NAME'],
        Record={
            'Data': jsondump
        }
    )
    print("Feedback logged via Firehose - response:", response)

# - Sends SNS notification for feedback.
def send_feedback_notification(qid, question, feedback_arg, user_info):
    user = ""
    if ("GivenName" in user_info):
        user += user_info["GivenName"]
    if ("FamilyName" in user_info):
        user += " " + user_info["FamilyName"]  
    if ("Email" in user_info):
        user += " <" + user_info["Email"] + ">"
    if feedback_arg == "incorrect":
        message = "Negative feedback (Thumbs Down) received on QnABot answer:\n"
    else: 
        message = "Positive feedback (Thumbs Up) received on QnABot answer:\n"
    notification_body = f"\n{message}\n\tTimestamp: {datetime.datetime.now().isoformat()} \n\tQuestion ID: {qid} \n\tQuestion: {question} \n\tUser: {user} \n\tFeedback: {feedback_arg}"
    print("Publishing SNS message: ", notification_body)
    client = boto3.client('sns')
    response = client.publish(
        TargetArn=  os.environ['SNS_TOPIC_ARN'], 
        Message=json.dumps({'default': notification_body
        }),
        Subject='QnABot - Feedback received',
        MessageStructure='json'
    )
    print("Feedback notification sent to SNS - response:", response)

# - Sends feedback notification for Kendra feedback.
def submit_feedback_for_kendra(kendra_index_id, kendra_query_id, kendra_result_id, kendra_relevancy):
    client = boto3.client('kendra')
    response = client.submit_feedback(
        IndexId=kendra_index_id,
        QueryId=kendra_query_id,
        RelevanceFeedbackItems=[
            {
                'ResultId': kendra_result_id,
                'RelevanceValue': kendra_relevancy
            },
        ]
    )
    print("Feedback submitted to Kendra - response", response)
