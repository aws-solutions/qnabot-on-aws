import json
import boto3
import os
import botocore.response as br
import string
import random

def handler(event,context):
    print("Entering handler, received following event: ")
    print(json.dumps(event))
    
    botResponse = event["res"].get("message", "")
    quizBot=event["res"]["session"].get("quizBot",{}) 
    nextQuestionQid = ""
        
    if (!quizBot):
        nextQuestionQid = event["res"]["result"].get("args")[0]
        quizBot = {
            "questionCount":0,
            "correctAnswerCount":0,
            "next":nextQuestionQid,
            "originalDocumentQid":event["res"]["session"]["previous"].get("qid", "")
        }
        
    if (quizBot["questionCount"] > 0):
        quizBot["userAnswer"]=event["req"]["question"]
        correctAnswerIndices = quizBot["correctAnswerIndices"]
        userAnswerIndex = ord(standardizeString(quizBot["userAnswer"])[:1]) - ord('A')
        
        if (userAnswerIndex in correctAnswerIndices):
            quizBot["correctAnswerCount"] += 1
            botResponse += "Correct answer!"
        else:
            botResponse += "Sorry, that was incorrect. "
            if (len(correctAnswerIndices) == 1):
                botResponse += "The correct answer was {0}. ".format(chr(correctAnswerIndices[0] + ord('A')))
            else:
                botResponse += "All of the following answers were correct: "
                for x in correctAnswerIndices:
                    botResponse += chr(x + ord('A')) + ", "
                    
                # these lines help the bot's grammar
                botResponse = botResponse[:-3] + "and " + botResponse[-3:]
                botResponse = botResponse[:-2]
    
    currentDocument=getNextQuestionQid(quizBot)
    quizBot["current"]=currentDocument 
    if (currentDocument):
        currentDocumentContents = getDocumentContents(currentDocument, event)
        botResponse += "\n" + currentDocumentContents["question"] + " \n"
        
        answerPairs = assembleAnswerOptions(currentDocumentContents)
        quizBot["correctAnswerIndices"] = []
        for i, answerPair in enumerate(answerPairs):
            botResponse += answerPair[0] + " \n"
            if (answerPair[1]):
                quizBot["correctAnswerIndices"].append(i)
                
        if ("r" in currentDocumentContents):
            event["res"]["card"]={
                "send":True,
                "title":currentDocumentContents["r"]["title"],
                "imageUrl":currentDocumentContents["r"]["imageUrl"]
            }
        event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']
        quizBot["questionCount"] += 1
        quizBot["next"] = getNextQuestionQid(currentDocumentContents)
    if not quizShouldContinue(event):
        questionsAnsweredCount = quizBot["questionCount"]
        questionsCorrectCount = quizBot["correctAnswerCount"]
        botResponse += "\n"
        if (questionsCorrectCount != 1):
            botResponse += "You got {0} questions correct out of ".format(questionsCorrectCount)
        else:
            botResponse += "You got 1 question correct out of "
        botResponse += "{0}, with a score of ".format(questionsAnsweredCount)
        botResponse += "{0:.2f}%. ".format((questionsCorrectCount * 100.0)/(questionsAnsweredCount * 1.0))
        botResponse += "Thank you for taking the quiz! "
        event["res"]["session"].pop("quizBot", None)
        event["res"]["session"].pop("queryLambda", None)
    
    event["res"]["message"] = botResponse
    print(json.dumps(event))
    return event
    
def getDocumentContents(documentID, event):
    print("getting document contents for: ")
    print(documentID)
    
    client = boto3.client("lambda")
    tempResponse = client.invoke(
        FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
        Payload = json.dumps({"qid":documentID}),
        InvocationType = "RequestResponse"
        )
    tempResponsePopulated = tempResponse["Payload"].read()
    return json.loads(tempResponsePopulated)

def quizShouldContinue(event):
    current=event["res"]["session"].get("quizBot", {}).get("current", "")
    first=event["res"]["result"].get("args")[0]
    wantsToQuit=userWantsToQuit(event["req"]["question"])
    return (current or first) and not wantsToQuit

def userWantsToQuit(userAnswer):
    tempStr = standardizeString(userAnswer)
    tempBool = ((tempStr == "QUIT") or (tempStr == "EXIT"))
    return tempBool

def getNextQuestionQid(quizBotDict):
    nextQid = quizBotDict["next"]
    
    if (isinstance(quizBotDict["next"], list) and len(quizBotDict["next"]) > 0):
        return nextQid[0]
    else:
        return nextQid
    
def standardizeString(inputString):
    translationTable = str.maketrans({key: None for key in string.punctuation})
    st = inputString.translate(translationTable)
    return st.upper().strip()

def assembleAnswerOptions(documentContents):
    allAnswers = []
    for answer in documentContents.get("incorrectAnswers", []):
        answerAndCorrectness = [answer, False]
        allAnswers.append(answerAndCorrectness)
    
    for answer in documentContents.get("correctAnswers", []):
        answerAndCorrectness = [answer, True]
        allAnswers.append(answerAndCorrectness)
       
    random.shuffle(allAnswers)
    
    letterCode = ord('A')
    for answerAndCorrectness in allAnswers:
        answerAndCorrectness[0] = chr(letterCode) + ". " + answerAndCorrectness[0]
        letterCode += 1
    
    return allAnswers

