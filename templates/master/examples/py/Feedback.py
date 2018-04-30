from __future__ import print_function
import json
import boto3
import os
import collections
import botocore.response as br
import datetime


def handler(event, context):

    #uncomment below if you want to see the JSON that is being passed to the Lambda Function
    # jsondump = json.dumps(event)
    # print(jsondump)
    
    # list of all the valid qids to be used for response feedback
    validResponseQid = collections.OrderedDict()
    validResponseQid.update({'A':'The answer was a good response to your question.'})
    validResponseQid.update({'B':'The answer was a bad response to your question.'})
    validResponseQid.update({'C':'The answer is wrong or does not make sense.'})
    validResponseQid.update({'D':'There is something else wrong with the answer.'})

    #the Qid to exit feedback without leaving feedback
    exitResponseQid={'E':'Cancel leaving feedback'}
    previousQid = None
    previousQuestion = None
    previousAnswer = None
    #Information will be stored here when going into feedback mode because we are going through Elastic Search
    try:
        currentQid = event['res']['result']['qid']
    #Have to get information through the question when we bypass Elastic Search and go directly to this function (Not Ideal) 
    except:
        currentQid = event["req"]["question"].upper()
    try:
        #get the Question ID (qid) of the previous document that was returned to the web client 
        stringToJson = json.loads(event["req"]["_event"]["sessionAttributes"]["previous"])
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
        event["res"]["session"]["previous"] = {'qid': '' , 'a': msg,'q':event["req"]["question"]}
        #set back to normal mode if in feedback mode
        event["res"]["session"].pop("queryLambda",None)
    # if it is a valid response for feedback
    elif currentQid in validResponseQid:
        logFeedback(previousQid,previousQuestion,previousAnswer,previousAlt,validResponseQid.get(currentQid))
        event["res"]["message"] = "Thank you for leaving the feedback,{0}. Relevant information has been logged and will be looked at.".format(validResponseQid.get(currentQid))
        event["res"]["session"]["previous"] = {'qid': previousQid , 'a': previousAnswer,'q': previousQuestion}
        #set back to normal mode if in feedback mode
        event["res"]["session"].pop("queryLambda",None)
    elif currentQid in exitResponseQid:
        event["res"]["message"] = "Canceled Feedback"
        event["res"]["session"]["previous"] = {'qid': previousQid , 'a': previousAnswer,'q':previousQuestion}
        #set back to normal mode if in feedback mode
        event["res"]["session"].pop("queryLambda",None)
    else:
        defaultResp = [
            'What feedback would you like to leave for the question, "{0}" ?'.format(previousQuestion),
        ]
        #Append list of all valid responses
        for key,value in validResponseQid.items():
            defaultResp.append('{0}. {1}'.format(key,value))
        #Append list of all exit responses
        for key,value in exitResponseQid.items():
            defaultResp.append('{0}. {1}'.format(key,value))
        #Send the the initial response for feedback options
        tempAnswerNormal = '\n'.join(defaultResp)
        tempAnswerMarkdown = '<br/>'.join(defaultResp)
        event["res"]["message"] = '{0}'.format(tempAnswerNormal)
        event["res"]["session"]["appContext"]["altMessages"] = '{0}'.format(tempAnswerMarkdown)
        #Make sure that the response triggers this lambda function by setting the session attribute
        event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']
        #set the qid and question of the previous as if this question had never been asked
        event["res"]["session"]["previous"] = {'qid': previousQid , 'a': previousAnswer,'q': previousQuestion}
    return event

#logs feedback for the questions
def logFeedback(qid,question,answer,markdown, feedback):
    #uncomment below if you would like to see values passed in 
    #print("Qid:{0} \n with feedback {3} \n has received feedback{1}, \n for the question: {2}".format(qid,feedback,question,answer))
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

