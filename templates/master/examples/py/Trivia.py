import json
import boto3
import os
import botocore.response as br


def lambda_handler(event,context):
    print(json.dumps(event,indent=4))
    client = boto3.client('lambda')
    
    # initialize response message
    msg = event["res"].get("message","")
    userExit = False
    
    # process utterance, if it's an answer to a previous question
    n = int(event["res"]["session"].get("questionNumber","0"))
    questionCount = int(event["res"]["session"].get("questionCount","0"))
    correctCount = int(event["res"]["session"].get("correctCount","0"))

    #This is the default quiz name
    quizName = event["res"]["session"].get("quizName","quiz")
    
    print "n = {0}".format(n)
    if n:
        # questionNumber is set, so utterance (confusingly, in "question field") is an answer
        user_ans = event["req"]["question"].upper()
        
        userExit = does_user_want_to_exit(user_ans)
        if (not userExit):
            correct_ans = get_answer(n, event, quizName)
            print "User answer: {0}, Correct Answer: {1}".format(user_ans, correct_ans)
            questionCount += 1
            if user_ans == correct_ans:
                msg += "  Awesome - you are correct!"
                correctCount += 1            
            else:
                msg += "  Sorry, the correct answer is {0}.".format(correct_ans)
        else:
            print "User has requested to quit:  {0}".format(user_ans)
    else:
        quizName = get_quiz_name(event, quizName)

    # append next quiz question to document answer
    n += 1
    if (more_questions(n, event, quizName) and (not userExit)):
        print "There are more questions"
        msg += "  Now for the next question.  "
        q = get_question(n, event, quizName)
        msg += q
        # set Session attribute to redirect answer back to this function
        event["res"]["session"]["queryLambda"] = os.environ['AWS_LAMBDA_FUNCTION_NAME']
        # set Session attribute to track current question number

        print "session.questionNumber = {0}".format(n)
        print "session.questionNumer = {0}".format(questionCount)
        print "session.correctCount = {0}".format(correctCount)
        print "session.quizName = {0}".format(quizName)
        
        event["res"]["session"]["questionNumber"] = str(n)
        event["res"]["session"]["questionCount"] = str(questionCount)
        event["res"]["session"]["correctCount"] = str(correctCount)
        event["res"]["session"]["quizName"] = quizName


    else:
        #Compute score and provide totals
        print "There are no more questions"
        print "questionCount = {0}".format(questionCount)
        
        if questionCount > 0:
            if userExit:
                msg += "  No more questions."
            else:
                msg += "  The user has requested to cancel."
                
            msg += "You got {0} questions correct out of a total of ".format(correctCount)
            msg += "{0} questions for a score of ".format(questionCount)
            if (questionCount * 1.0) != 0:
                score = (correctCount * 100.0) / (questionCount * 1.0)
            else:
                score = 0
            msg += "{0:.2f}%.".format(score)
        
        # unset Session attributes to revert to QnA mode
        event["res"]["session"].pop("queryLambda",None)
        event["res"]["session"].pop("questionNumber",None)
        event["res"]["session"].pop("questionCount",None)
        event["res"]["session"].pop("correctCount",None)
        event["res"]["session"].pop("quizName",None)
        event["res"]["session"]["topic"] = "quiz"
#        client.invoke(
#            FunctionName = "qna-NextRoomQuiz",
#            Payload = json.dumps(event),
#            InvocationType = "Event"
#        )
    
    event["res"]["message"] = msg
    return event

def more_questions(n, event, quizName):
    # retrieve questions from document ID
    # note that this will require your quiz documents names to be formatted as e.g. BlueRoomQuiz.1, BlueRoomQuiz.2
    qid = quizName + ".{0}".format(n)

    #If qid is not a digit or empty then we must be entering the first room
    print("Getting question for:")
    print(qid)
    client = boto3.client('lambda')

    resp = client.invoke(
        FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
        Payload = json.dumps({'qid':qid}),
        InvocationType = "RequestResponse"
        )
    response = resp['Payload'].read()
    responseDictionary = json.loads(response)
    print("End of quiz = {0}").format(responseDictionary)

    return responseDictionary
    
def get_question(n, event, quizName):
    # retrieve questions from document ID
    qid = quizName + ".{0}".format(n)

    #If qid is not a digit or empty then we must be entering the first room
    print("Getting question for:")
    print(qid)
    client = boto3.client('lambda')

    resp = client.invoke(
        FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
        Payload = json.dumps({'qid':qid}),
        InvocationType = "RequestResponse"
        )
    response = resp['Payload'].read()
    responseDictionary = json.loads(response)
    print("HEY LOOK HERE")
    print(responseDictionary)
    print("OKAY NOW STOP")

    questionDictionary = responseDictionary["questions"]
    print(questionDictionary)

    questionsLength = len(responseDictionary["questions"])
    questionString = responseDictionary["a"]
    questionString += "  Is the answer: "
    
    for c in range(0,questionsLength):
        questionString += responseDictionary["questions"][c]["q"]
        if c < (questionsLength - 1):
            questionString += ", "

    print(questionString)

    print("Getting image card...")
    if "imageUrl" in event["res"]["card"]:
        print("found an imageUrl!")
        cardURL = event["res"]["card"]["imageUrl"]
    
    try:
        cardURL
    except NameError:
        print "cardURL not defined"
    else:
        #if we find a card URL in the response, set the  send value to True   
        if cardURL:
            print("CardURL = {0}").format(cardURL)
            event["res"]["card"]["send"] = True
            print("Setting Send = True")

    return questionString
    
def normalize_abcd(str):
    str.translate(None, string.punctuation)
    return str

def get_answer(n, event, quizName):
   # retrieve questions from document ID
    qid = quizName + ".{0}".format(n)

    #If qid is not a digit or empty then we must be entering the first room
    print("Getting answer for:")
    print(qid)
    client = boto3.client('lambda')

    resp = client.invoke(
        FunctionName = event["req"]["_info"]["es"]["service"]["qid"],
        Payload = json.dumps({'qid':qid}),
        InvocationType = "RequestResponse"
        )
    response = resp['Payload'].read()
    responseDictionary = json.loads(response)
    
    answerString = "The correct answer is {0}".format(responseDictionary["t"].upper())
    print(answerString)
    
    return responseDictionary["t"].upper()

def does_user_want_to_exit(userAnswer):
   # Check to see if the user said any of the exit statements
    return ((userAnswer == "EXIT") or (userAnswer == "QUIT") or (userAnswer == "QUIT"))

def get_quiz_name(event, quizName):
   # retrieve quiz name from response
    
    print("Getting quiz name")
    client = boto3.client('lambda')
    newQuizName = event["res"]["session"]["topic"]

    #if we don't find a quiz name in the response, use the default name    
    if not newQuizName:
        newQuizName = quizName

    print(newQuizName)
    return newQuizName