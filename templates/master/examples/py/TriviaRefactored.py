import json
import boto3
import os
import botocore.response as br
import string

def handler(event,context):
    print(json.dumps(event))
    
    print(json.dumps(event))
    return event
    
def getQuizName(event):
    quizName = ""
    if ("topic" in event["res"]["session"]):
        quizName = event["res"]["session"]["topic"]
    print("Quiz Name: ")
    print(quizName)
    return quizName
    
def getCorrectAnswers(event):
    correctAnswers = {}
    
    print("Correct Answers: ")
    print(correctAnswers)
    return correctAnswers
    
def getIncorrectAnswers(event):
    incorrectAnswers = {}
    
    print("Incorrect Answers: ")
    print(incorrectAnswers)
    return incorrectAnswers
    
def getUserAnswer(event):
    userAnswer = ""
    
    print("User Answer: ")
    print(userAnswer)
    return userAnswer
    
def getNextQuestionQid(event):
    nextQid = ""
    
    print("Next QID: ")
    print(nextQid)
    return nextQid
    
def standardizeString(str):
    str.translate(None, string.punctuation)
    print("Standardized String: ")
    print(str.upper())
    return str.upper()

def userWantsToQuit(userAnswer):
    tempStr = standardizeString(userAnswer)
    tempBool = ((tempStr == "QUIT") or (tempStr == "EXIT"))
    print("userWantsToQuit: ")
    print(tempBool)
    return tempBool
