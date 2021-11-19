# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import json
import os
import boto3
import base64
import datetime
import calendar
import urllib3
import urllib.parse

from fuzzywuzzy import fuzz
from fuzzywuzzy import process
from botocore.exceptions import ClientError


# Import the Canvas class
import canvasapi
from canvasapi import Canvas


MATCHING_TOLERANCE_SCORE = 70   #used for matching accuracy with fuzzy match
api_token = '' #variable to hold the value of API_Token stored in AWS Secrets Manager
canvas = None   #variable to hold the Canvas object


"""
function: get_secret from AWS Secrets Manager
This function retrieves the secret string from AWS Secrets Manager. 
We will retrieve the Canvas API Token using this function. 
Refer to the readme for more details on how to store secret in AWS Secrets Manager, and configure QnABot with the secret key name. 
"""
def get_secret(secrets_name):
    region_name = os.environ['AWS_REGION']

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )

    # In this sample we only handle the specific exceptions for the 'GetSecretValue' API.
    # See https://docs.aws.amazon.com/secretsmanager/latest/apireference/API_GetSecretValue.html
    # We rethrow the exception by default.

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secrets_name
        )
        # Decrypts secret using the associated KMS CMK.
        # Depending on whether the secret is a string or binary, one of these fields will be populated.
        if 'SecretString' in get_secret_value_response:
            secret = get_secret_value_response['SecretString']
            secret = json.loads(get_secret_value_response['SecretString'])['API_Token']
        else:
            decoded_binary_secret = base64.b64decode(get_secret_value_response['SecretBinary'])
            secret = decoded_binary_secret.API_Token
    except ClientError as e:
        print ("ERROR: "+ str(e))  #print the exception
        raise e

    #return the API token
    return secret


"""
function to get Canvas User
This function retrieves the Canvas user by using the SIS Login ID
"""
def getCanvasUser (param_canvas, param_user_name):
    user = param_canvas.get_user(param_user_name, 'sis_login_id')
    return user


"""
function: query_enrollments_for_student
This function retrieves students' active enrollments 
"""
def query_enrollments_for_student(canvas, student_user_name, userinput):
    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)

    if user:
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])
        # Loop through the courses.
        course_names = [course.name for course in courses]

    result = {"CourseNames": course_names}
    return result
    

"""
function: query_courses_for_student
This function performs a fuzzy matching logic to find a matching course based on user input
for example: more information about {course name}
"""
def query_courses_for_student(canvas, student_user_name, userinput):
    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    
    if user:
        courses = user.get_courses(enrollment_status='active')
        # Loop through the courses.
        course_names = [course.name for course in courses]
        choice = process.extractOne(userinput, course_names, scorer=fuzz.token_set_ratio)

    result = {"Choice": choice[0]}
    return result


"""
function: query_course_assignments_for_student
This function retrieves assignment information across all active enrolled courses, or for a particular course, for the student
Also performs a fuzzy matching logic to find a matching course based on user input
for example: do i have any assignments due or do i have any assignments due in {course name}
"""
def query_course_assignments_for_student(canvas, student_user_name, userinput):
    course_assignments = ''
    blnHasAssignments = False
    blnFoundMatch = False

    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    
    if user:
        courses = user.get_courses(enrollment_status='active')
    
        # Loop through the courses.
        course_names = [course.name for course in courses]
        choice = process.extractOne(userinput, course_names, scorer=fuzz.token_set_ratio)

        for course in courses:
            blnHasAssignments = False
            blnFoundMatch = False

            #check for matching userinput with course names
            if course.name == choice[0] and choice[1] > MATCHING_TOLERANCE_SCORE:
                blnFoundMatch = True

            if blnFoundMatch == True:
                course_assignments = "<b>" + course.name + "</b> <ul>"
            else:
                course_assignments += "<b>" + course.name + "</b> <ul>"                

            # Loop through the assignments that have not been submitted
            for assignment in course.get_assignments(bucket='unsubmitted'):
                blnHasAssignments = True
                if assignment.due_at:   #check if assignments have due dates
                    due_date = datetime.datetime.strptime(assignment.due_at,'%Y-%m-%dT%H:%M:%SZ')
                    due_date_string = '{0}, {1} {2}, {3}'.format(calendar.day_name[due_date.weekday()], due_date.strftime("%B"), due_date.strftime("%-d"), due_date.strftime("%Y"))
                    course_assignments += "<li>{} -- is due: {}</li>".format(assignment.name, due_date_string)
                else:
                    course_assignments += "<li>{} -- has no due date</li>".format(assignment.name)

            if blnHasAssignments == False:
                course_assignments += "There are no assignments for this course."

            course_assignments += "</ul><br>"

            #if found a matching course based on fuzzy matching logic, then break from the course For loop
            if blnFoundMatch == True:
                break

    result = {"CourseAssignments": course_assignments}
    return result


"""
function: query_announcements_for_student
This function retrieves any announcements across all active enrolled courses for the student
for example: do i have any announcements
"""
def query_announcements_for_student(canvas, student_user_name, userinput):
    course_announcements = '<ul>'

    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)

    course_names = []
    if user:
        courses = user.get_courses(enrollment_status='active')
    
        # Loop through the courses.
        for course in courses:
            course_names.append(course.name)
            for discussion_topic in canvas.get_announcements(context_codes=[course.id]): 
                if discussion_topic:
                    announcement_date = datetime.datetime.strftime(discussion_topic.posted_at_date,"%b %d %Y %-I:%M %p")
                    course_announcements += '<li><b>{0}</b>: {1} on {2}<br>{3}</li>'.format(course.name, discussion_topic.title, announcement_date, discussion_topic.message)
                else:
                    course_announcements += 'You currently have no announcements'
            # get_announcements returns a list of discussion topics.

    course_announcements += '</ul>'

    result = {"Announcements": course_announcements}
    return result


"""
function: query_grades_for_student
This function retrieves grade information across all active enrolled courses, or for a particular course, for the student
Also performs a fuzzy matching logic to find a matching course based on user input
for example: tell me about my grades, or how did i do in {course name}
"""
def query_grades_for_student(canvas, student_user_name, userinput):
    course_grades = '<ul>'
    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    
    if user:
        courses = user.get_courses(enrollment_status='active')

        # Loop through the courses.
        course_names = [course.name for course in courses]
        choice = process.extractOne(userinput, course_names, scorer=fuzz.token_set_ratio)
        courses = user.get_enrollments(include='current_points', search_by='course')

        if courses: 
            for grade in courses:
                course_name = canvas.get_course(grade.course_id)
                if grade.grades['current_score'] != '':
                    grade_score = grade.grades['current_score']
                else:
                    grade_score = "N/A"

                #check for matching userinput with course names
                if course_name.name == choice[0] and choice[1] > MATCHING_TOLERANCE_SCORE:
                    course_grades = "<li>Grades for {} course: {}</li>".format(course_name.name, grade_score)
                    break
                else:
                    course_grades += "<li>Grades for {} course: {}</li>".format(course_name.name, grade_score)
        else:
            course_grades = "There are no enrolled courses."

        course_grades += "</ul>"

    result = {"Grades": course_grades}
    return result


"""
function: query_syllabus_for_student
This function retrieves syllabus information across all active enrolled courses, or for a particular course, for the student
Also performs a fuzzy matching logic to find a matching course based on user input
for example: what is my syllabus, or tell me about my {course name} syllabus
"""
def query_syllabus_for_student(canvas, student_user_name, userinput):
    no_syllabus = 'There is no syllabus currently available for this course.'
    course_syllabus = ''

    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    if user:
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])

        # Loop through the courses.
        course_names = [course.name for course in courses]
        choice = process.extractOne(userinput, course_names, scorer=fuzz.token_set_ratio)

        if courses: 
            # Loop through the courses.
            for course in courses:
                #check for matching userinput with course names
                if course.name == choice[0] and choice[1] > MATCHING_TOLERANCE_SCORE:
                    if course.syllabus_body.strip() != '':
                        course_syllabus = '<b>{0}</b>: {1}<br>'.format(course.name, course.syllabus_body)
                        break
                    else:
                        course_syllabus = no_syllabus
                        break
                else:
                    if course.syllabus_body.strip() != '':
                        course_syllabus += '<b>{0}</b>: {1}<br>'.format(course.name, course.syllabus_body)
                    else:
                        course_syllabus += '<b>{0}</b>: {1}<br>'.format(course.name, no_syllabus)

    result = {"CourseSyllabus": course_syllabus}
    return result


"""
function: validate_input
This function checks whether the user is logged in
Additionally, also checks if the question in the QnABot designer include a {Query} parameter for the Lambda hook argument
"""
def validate_input(event):
    error_message = ''

    try:
        if not error_message:
            error_message = 'You must provide a question.'
            if json.loads(event['res']['result']['args'][0])['Query']:
                error_message = ''

        if not error_message:
            error_message = 'You are not logged in.'
            if event['req']['_userInfo']['Email']:
                error_message = ''
    except:
        pass

    return error_message


"""
function handler
Main handler function
This function processes:
a. lambda hook arguments
b. processes user input
c. provides response back to the user
"""
def handler(event, context):
    userinput = event["req"]["_event"]["inputTranscript"]
    return_message = ''

    global api_token
    global canvas

    # Validate the required input.
    error_message = validate_input(event)

    if error_message:
        return_message = error_message
        #event['res']['message'] = return_message
        event['res']['session']['appContext']['altMessages']['markdown'] = return_message
    else:
        # Get the API domain. This will be needed for API calls and for looking up the bearer token.
        domain = event['req']['_settings']['CanvasDomainName']
        secrets_name = event['req']['_settings']['CanvasAPIKey']

        # Get the API Token from AWS Secrets Manager
        if api_token == '':
            api_token = get_secret(secrets_name)

        # Initialize Canvas object
        if canvas is None:
            canvas = Canvas(domain, api_token)

        try:
            # Get the student's email address from the request.
            student_user_name = event['req']['_userInfo']['UserName']
            student_name = event['req']['_userInfo']['GivenName']

            # Get the query from the request.
            query = json.loads(event['res']['result']['args'][0])['Query']

            # Determine what the query is.
            if query == 'CourseAssignments':
                # Retrieve the assignments for this student.
                result = query_course_assignments_for_student(canvas, student_user_name, userinput)
                if result['CourseAssignments']:
                    return_message = result['CourseAssignments']
                    event['res']['session']['appContext']['altMessages']['markdown'] = return_message
                else:
                    event['res']['session']['appContext']['altMessages']['markdown'] = "There are no upcoming assignments for this course."
            elif query == 'CanvasMenu':
                # provide a menu to choose from (announcements, enrollments, syllabus, assignments, grades)
                choicelist = [{'text':'Announcements','value':"tell me about my announcements"}, {'text':'Course Enrollments','value':"tell me about my enrollments"}, {'text':'Course Syllabus','value':"tell me about my syllabus"}, {'text':'Assignments','value':"tell me about my assignments"}, {'text':'Grades','value':"tell me about my grades"}]
                genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
                event['res']['session']['appContext']['responseCard'] = genericAttachments
                event['res']['session']['appContext']['altMessages']['markdown'] = "Hello {}, please select one of the options below:".format(student_name)
            elif query == 'CourseEnrollments':
                # Retrieve the course options for this student.
                result = query_enrollments_for_student(canvas, student_user_name, userinput)
                return_courses = result['CourseNames']
                if return_courses:
                    choicelist = []
                    for i in return_courses:
                        choicelist.append({'text':i,'value':"more information about my {} course".format(i)})
                    genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
                    event['res']['session']['appContext']['responseCard'] = genericAttachments
                    event['res']['session']['appContext']['altMessages']['markdown'] = "Please select one of the options below:"
                else:
                    event['res']['session']['appContext']['altMessages']['markdown'] = "You are not currently enrolled in any courses"
            elif query == 'SyllabusForCourse':
                # Retrieve the course syllabus for this student.
                result = query_syllabus_for_student(canvas, student_user_name, userinput)
                event['res']['session']['appContext']['altMessages']['markdown'] = result['CourseSyllabus']
            elif query == 'CoursesForStudent':
                # Retrieve the course options for this student.
                result = query_courses_for_student(canvas, student_user_name, userinput)
                returned_course = result['Choice']
                genericattachment = ['assignments','syllabus','grades']
                choicelist = []
                for i in genericattachment:
                    choicelist.append({'text':'{} {}'.format(returned_course,i),'value':'tell me about my {} {}'.format(returned_course,i)})
                genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
                event['res']['session']['appContext']['responseCard'] = genericAttachments
            elif query == 'AnnouncementsForStudent':
                # Retrieve the announcements for this student.
                result = query_announcements_for_student(canvas, student_user_name, userinput)
                if result['Announcements']:
                    return_message = 'Here are your announcements: {}'.format(result['Announcements'])
                    event['res']['session']['appContext']['altMessages']['markdown'] = return_message
                else:
                    event['res']['session']['appContext']['altMessages']['markdown'] = "You don't have any announcements at this moment."
            elif query == 'GradesForStudent':
                # Retrieve the course grades for this student.
                result = query_grades_for_student(canvas, student_user_name, userinput)
                return_message = result['Grades']
                event['res']['session']['appContext']['altMessages']['markdown'] = return_message
            else: 
                return_message = 'There was an error processing your request. For a list of available options, type or say <i>canvas menu</i>.' 
                event['res']['session']['appContext']['altMessages']['markdown'] = return_message
        except ValueError as e:
            print ("ERROR: "+ str(e))  #print the exception
            return_message = 'There was an error processing your request. Please contact your administrator.'
            event['res']['session']['appContext']['altMessages']['markdown'] = return_message

    # Return the result.
    return event