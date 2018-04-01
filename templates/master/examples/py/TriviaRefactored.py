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
    
    nextQuestionQid = ""
    if ("quizBot" in event["res"]["session"]):
        # we're almost surely being called during a quiz after this function has already run if this is true
        
        print("debugging quizbot session field: ")
        print(event["res"]["session"]["quizBot"])
        
        # these lines get rid of that nasty string-formatted JSON and give us a dict instead
        # we have to do this conditionally because the lex UI always turns dict fields into strings
        # but this function isn't always being called by the lex UI
        if (isinstance(event["res"]["session"]["quizBot"], str)):
            quizBotDict = json.loads(event["res"]["session"]["quizBot"])
            event["res"]["session"].pop("quizBot", None)
            event["res"]["session"]["quizBot"] = quizBotDict
        
        if (event["res"]["session"]["quizBot"]["questionCount"] > 0):
            # if we're past the first question, the user has answered the previous question and we need to grade them
            
            event["res"]["session"]["quizBot"]["userAnswer"] = getUserResponse(event)
            correctAnswerIndices = event["res"]["session"]["quizBot"]["correctAnswerIndices"]
            userAnswerIndex = ord(standardizeString(event["res"]["session"]["quizBot"]["userAnswer"])[:1]) - ord('A')
            
            if (userAnswerIndex in correctAnswerIndices):
                event["res"]["session"]["quizBot"]["correctAnswerCount"] += 1
                botResponse += "Correct answer! \n"
            else:
                botResponse += "Sorry, that was incorrect. "
                if (len(correctAnswerIndices) < 1):
                    botResponse += "There were no correct answers to this question! Whoever wrote it wasn't being very nice :( \n"
                elif (len(correctAnswerIndices) == 1):
                    botResponse += "The correct answer was {0}. \n".format(chr(correctAnswerIndices[0] + ord('A')))
                else:
                    botResponse += "All of the following answers were correct: "
                    for x in correctAnswerIndices:
                        botResponse += chr(x + ord('A')) + ", "
                        
                    # these lines help the bot's grammar
                    botResponse = botResponse[:-3] + "and " + botResponse[-3:]
                    botResponse = botResponse[:-2]
                    botResponse += " \n"

        event["res"]["session"]["quizBot"]["current"] = getNextQuestionQid(event["res"]["session"]["quizBot"])
        currentDocumentContents = getDocumentContents(event["res"]["session"]["quizBot"]["current"], event)
        print("Current document contents: ")
        print(json.dumps(currentDocumentContents))
        
        # we don't want to ask a question that doesn't exist, but we can't exit the quiz during the last question because we still need to grade the last question
        if (event["res"]["session"]["quizBot"]["current"]):
            # this is where the bot asks the question
            botResponse += "\n" + currentDocumentContents["question"] + " \n"
            
            # this is where the bot reads off the possible answers
            answerPairs = assembleAnswerOptions(currentDocumentContents)
            event["res"]["session"]["quizBot"]["correctAnswerIndices"] = []
            for i, answerPair in enumerate(answerPairs):
                botResponse += answerPair[0] + " \n"
                if (answerPair[1]):
                    event["res"]["session"]["quizBot"]["correctAnswerIndices"].append(i)
            
            event["res"]["session"]["quizBot"]["questionCount"] += 1
            event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']
            event["res"]["session"]["quizBot"]["next"] = getNextQuestionQid(currentDocumentContents)
        
    elif (os.environ['AWS_LAMBDA_FUNCTION_NAME'] in event["res"].get("result", {}).get("l", "")):
        # we're entering a quiz for the first time if we are here because we're getting called from the UI through a lambda hook
        # this conditional *should* accommodate both ARNs and lambda function names in the hook field
        
        # we want to call this lambda from within this conditional block after setting up the session variables that will trigger the conditional block above this one
        # we then want to return the event resulting from that call
        # why? because we need certain previous question info to transition from previous calls to this call through some sort of API (event["res"]["session"]["quizBot"])
        # but we can't force the lex UI to comply with that API before we've set session variables
        # so this conditional block is how we set up those session variables and then invoke this lambda so that we don't have to re-code all of our functionality just for the first question
        
        nextQuestionQid = getFirstQuestionQid(event)
        print("printing raw variable nextQuestionQid in the first execution: ")
        print(nextQuestionQid)
        event["res"]["session"]["quizBot"] = {}
        event["res"]["session"]["quizBot"]["questionCount"] = 0
        event["res"]["session"]["quizBot"]["correctAnswerCount"] = 0
        event["res"]["session"]["quizBot"]["next"] = nextQuestionQid
        print("printing session variable nextQuestionQid in the first execution: ")
        print(event["res"]["session"]["quizBot"]["next"])
        event["res"]["session"]["quizBot"]["originalDocumentQid"] = event["res"]["session"]["previous"].get("qid", "")
        event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']
        
        quizInitialResponse = boto3.client("lambda").invoke(
            FunctionName = os.environ['AWS_LAMBDA_FUNCTION_NAME'],
            Payload = json.dumps(event),
            InvocationType = "RequestResponse"
            )
        event = json.loads(quizInitialResponse["Payload"].read())
        
        print("Exiting handler after quiz initialization, returning following event: ")
        print(json.dumps(event))
        return event
        
    else:
        # this lambda function is being called in a very unexpected fashion if we are here
        
        print("TriviaRefactored error: this lambda function doesn't know how to handle the event it received.  Dumping pre-cleanup event: ")
        print(json.dumps(event))
        event["res"]["session"].pop("quizBot", None)
        event["res"]["session"].pop("queryLambda", None)
        print("Exiting handler, returning post-cleanup event: ")
        print(json.dumps(event))
        return event
    
    if not quizShouldContinue(event):
        questionsAnsweredCount = event["res"]["session"].get("quizBot", {}).get("questionCount", -1)
        questionsCorrectCount = event["res"]["session"].get("quizBot", {}).get("correctAnswerCount", -1)
        botResponse += "\n"
        if (questionsAnsweredCount != -1 and questionsCorrectCount != -1):
            botResponse += "You got {0} questions correct out of ".format(questionsCorrectCount)
            botResponse += "{0}, with a score of ".format(questionsAnsweredCount)
            botResponse += "{0:.2f}%. ".format((questionsCorrectCount * 100.0)/(questionsAnsweredCount * 1.0))
        botResponse += "Thank you for taking the quiz! "
        event["res"]["session"].pop("quizBot", None)
        event["res"]["session"].pop("queryLambda", None)
    
    # this is where we write the bot's response to the event and return it for a normal end to the function's execution
    event["res"]["message"] = botResponse
    print("Exiting handler, returning following event: ")
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
    checkResult = (event["res"]["session"].get("quizBot", {}).get("current", "") or getFirstQuestionQid(event)) and not userWantsToQuit(getUserResponse(event))
    print("quizShouldContinue result: ")
    print(checkResult)
    return checkResult
    
# this function gets the name of the first question in the quiz from the lambda hook arguments
# at some point it will need to be changed after we update the UI for better quiz-building
def getFirstQuestionQid(event):
    firstQuestionQid = ""
    if (event["res"].get("result", {})):
        if (len(event["res"].get("result", {}).get("args")) > 0):
            print("more than 0 lambda hook args")
            print(event["res"].get("result", {}).get("args"))
            firstQuestionQid = event["res"].get("result", {}).get("args")[0]
    print("First Question QID: ")
    print(firstQuestionQid)
    return firstQuestionQid
    
def getQuizName(event):
    quizName = event["res"].get("result", {}).get("quiz", "")
    print("Quiz Name: ")
    print(quizName)
    return quizName
    
def getCorrectAnswers(documentContents):
    correctAnswers = documentContents.get("correctAnswers", [])
    print("Correct Answers: ")
    print(correctAnswers)
    return correctAnswers
    
def getIncorrectAnswers(documentContents):
    incorrectAnswers = documentContents.get("incorrectAnswers", [])
    print("Incorrect Answers: ")
    print(incorrectAnswers)
    return incorrectAnswers
    
# lex UI will convert the session variable dictionaries to strings so we have to handle both cases
def getUserResponse(event):
    userResponse = event["req"]["question"]
    print("User Response: ")
    print(userResponse)
    return userResponse
    
# this function handles array-formatted next questions in case we want to implement branching later
def getNextQuestionQid(quizBotDict):
    nextQid = ""
    
    if ("next" in quizBotDict):
        if (isinstance(quizBotDict["next"], list) and len(quizBotDict["next"]) > 0):
            nextQid = quizBotDict["next"][0]
            print("nextQuestion was an array")
        if (isinstance(quizBotDict["next"], str)):
            nextQid = quizBotDict["next"]
            print("nextQuestion was a string")
        
    print("Next QID: ")
    print(nextQid)
    return nextQid
    
def standardizeString(inputString):
    translationTable = str.maketrans({key: None for key in string.punctuation})
    st = inputString.translate(translationTable)
    print("Standardized String: ")
    print(st.upper().strip())
    return st.upper().strip()

def userWantsToQuit(userAnswer):
    tempStr = standardizeString(userAnswer)
    tempBool = ((tempStr == "QUIT") or (tempStr == "EXIT"))
    print("userWantsToQuit: ")
    print(tempBool)
    return tempBool

# this function assembles correct and incorrect answers into a randomly-sorted list of 2-element lists
# where the second element is true for correct answer and the first element is the answer string
# with letters prefixed for multiple-choice options because our UI is currently not supportive 
# of other input methods when designing answer banks
def assembleAnswerOptions(documentContents):
    allAnswers = []
    for answer in getIncorrectAnswers(documentContents):
        answerAndCorrectness = [answer, False]
        allAnswers.append(answerAndCorrectness)
    
    for answer in getCorrectAnswers(documentContents):
        answerAndCorrectness = [answer, True]
        allAnswers.append(answerAndCorrectness)
       
    random.shuffle(allAnswers)
    
    letterCode = ord('A')
    for answerAndCorrectness in allAnswers:
        answerAndCorrectness[0] = chr(letterCode) + ". " + answerAndCorrectness[0]
        letterCode += 1
    
    return allAnswers
    
def isAnswerCorrect(answerLetter, listOfAnswerPairs):
    standardizedAnswerLetter = standardizeString(answerLetter)
    userAnswerListIndex = ord(standardizedAnswerLetter) - ord('A')
    if (userAnswerListIndex < 0 or userAnswerListIndex >= len(listOfAnswerPairs)):
        return False
    return listOfAnswerPairs[userAnswerListIndex][1]
    