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

from bs4 import BeautifulSoup
from botocore.exceptions import ClientError


def get_secret(secrets_name):
    """
    function: get_secret from AWS Secrets Manager
    This function retrieves the secret string from AWS Secrets Manager. 
    We will retrieve the Canvas API Token using this function. 
    Refer to the readme for more details on how to store secret in AWS Secrets Manager, and configure QnABot with the secret key name. 
    """

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


def getCanvasUser (param_canvas, param_user_name):
    """
    function to get Canvas User
    This function retrieves the Canvas user by using the SIS Login ID
    """

    user = param_canvas.get_user(param_user_name, 'sis_login_id')
    return user


def query_menu (event, student_name):
    """
    function to get menu
    """

    # provide a menu to choose from (announcements, enrollments, syllabus, assignments, grades)
    choicelist = [{'text':'Announcements','value':"tell me about my announcements"}, {'text':'Course Enrollments','value':"tell me about my enrollments"}, {'text':'Course Syllabus','value':"tell me about my syllabus"}, {'text':'Assignments','value':"tell me about my assignments"}, {'text':'Grades','value':"tell me about my grades"}]
    genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
    event['res']['session']['appContext']['responseCard'] = genericAttachments
    event['res']['session']['appContext']['altMessages']['markdown'] = "Please select one of the options below:"

    intCounter = 0
    strChoiceList = ""
    for items in choicelist: 
        if strChoiceList != '': 
            strChoiceList = strChoiceList + ", "
        strChoiceList = strChoiceList + choicelist[intCounter]['text']
        intCounter = intCounter + 1
    event['res']['session']['appContext']['altMessages']['ssml'] = get_SSML_output("Please select one of these options: " + strChoiceList)

    return event


def query_enrollments_for_student(event, canvas, student_user_name):
    """
    function: query_enrollments_for_student
    This function retrieves students' active enrollments 
    """

    # Get the user using user_id to match with LMS SIS_ID
    try: 
        user = getCanvasUser (canvas, student_user_name)
    except:
        return user_not_found_error (event)

    if user:
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])
        # Loop through the courses.
        course_names = [course.name for course in courses]

    result = {"CourseNames": course_names}

    return_courses = result['CourseNames']
    if return_courses:
        choicelist = []
        for i in return_courses:
            choicelist.append({'text':i,'value':"more information about my {} course".format(i)})
        genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
        event['res']['session']['appContext']['responseCard'] = genericAttachments
        event['res']['session']['appContext']['altMessages']['markdown'] = "Please select one of the options below:"

        intCounter = 0
        strChoiceList = ""
        for items in choicelist: 
            if strChoiceList != '': 
                strChoiceList = strChoiceList + ", "
            strChoiceList = strChoiceList + choicelist[intCounter]['text']
            intCounter = intCounter + 1
        event['res']['session']['appContext']['altMessages']['ssml'] = get_SSML_output("Please select one of these options: " + strChoiceList)
    else:
        return_message = "You are not currently enrolled in any courses."
        set_alt_message (event, return_message)

    return event
    

def query_courses_for_student(event, canvas, student_user_name, course_name_to_filter):
    """
    function: query_courses_for_student
    This function retrieves course options across all active enrolled courses, or for a particular course, for the student
    for example: more information about {course name}
    """

    # Get the user using user_id to match with LMS SIS_ID
    try: 
        user = getCanvasUser (canvas, student_user_name)
    except: 
        return user_not_found_error (event)

    blnFoundCourse = False
    if user:
        courses = user.get_courses(enrollment_status='active')
        # Loop through the courses.
        for course in courses:
            if course_name_to_filter != '' and course.name.upper().strip() == course_name_to_filter.upper():
                result = {"Choice": course.name}
                blnFoundCourse = True
                break
        if blnFoundCourse == False:
            result = {"Choice": 'N/A'}
    else: 
        result = {"Choice": 'N/A'}

    returned_course = result['Choice']
    if returned_course == 'N/A': 
        return_message = "Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses."
        set_alt_message (event, return_message)
    else: 
        genericattachment = ['assignments','syllabus','grades']
        choicelist = []
        for i in genericattachment:
            choicelist.append({'text':'{} {}'.format(returned_course,i),'value':'tell me about my {} {}'.format(returned_course,i)})
        genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
        event['res']['session']['appContext']['responseCard'] = genericAttachments
        event['res']['session']['appContext']['altMessages']['markdown'] = "Please select one of the options below:"

        intCounter = 0
        strChoiceList = ""
        for items in choicelist: 
            if strChoiceList != '': 
                strChoiceList = strChoiceList + ", "
            strChoiceList = strChoiceList + choicelist[intCounter]['text']
            intCounter = intCounter + 1
        event['res']['session']['appContext']['altMessages']['ssml'] = get_SSML_output("Please select one of these options: " + strChoiceList)

    return event


def query_course_assignments_for_student(event, canvas, student_user_name, course_name_to_filter):
    """
    function: query_course_assignments_for_student
    This function retrieves assignment information across all active enrolled courses, or for a particular course, for the student
    for example: do i have any assignments due or tell me about by {course_name} assignments
    """

    course_assignments = ''
    blnHasAssignments = False
    blnFoundMatch = False
    no_records_message = 'There are no assignments for this course.'
    # Get the user using user_id to match with LMS SIS_ID
    try: 
        user = getCanvasUser (canvas, student_user_name)
    except:
        return user_not_found_error (event)
    
    if user:
        courses = user.get_courses(enrollment_status='active')
        for course in courses:
            blnHasAssignments = False
            blnFoundMatch = False

            #check for matching course_name_slot_input with course names
            if course_name_to_filter != '' and course.name.upper().strip() == course_name_to_filter.upper():
                blnFoundMatch = True

            if blnFoundMatch == True:
                course_assignments = "<b>" + course.name + ": </b> <ul>"
            else:
                course_assignments += "<b>" + course.name + ": </b> <ul>"                

            # Loop through the assignments that have not been submitted
            for assignment in course.get_assignments(bucket='unsubmitted'):
                blnHasAssignments = True
                if course_name_to_filter != '' and course.name.upper().strip() != course_name_to_filter.upper():
                    # if a slot value is provided, but does not have a matching course that the student is enrolled in
                    course_assignments = "Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses."
                    break

                if assignment.due_at:   #check if assignments have due dates
                    due_date = datetime.datetime.strptime(assignment.due_at,'%Y-%m-%dT%H:%M:%SZ')
                    due_date_string = '{0}, {1} {2}, {3}'.format(calendar.day_name[due_date.weekday()], due_date.strftime("%B"), due_date.strftime("%-d"), due_date.strftime("%Y"))
                    course_assignments += "<li>{} -- is due: {}. </li>".format(assignment.name, due_date_string)
                else:
                    course_assignments += "<li>{} -- has no due date. </li>".format(assignment.name)

            if blnHasAssignments == False:
                course_assignments += no_records_message

            course_assignments += "</ul><br>"

            #if found a matching course, then break from the course For loop
            if blnFoundMatch == True:
                break

    result = {"CourseAssignments": course_assignments}
    if result['CourseAssignments']:
        return_message = result['CourseAssignments']
        set_alt_message (event, return_message)
    else:
        return_message = no_records_message
        set_alt_message (event, return_message)

    return event


def query_announcements_for_student(event, canvas, student_user_name):
    """
    function: query_announcements_for_student
    This function retrieves any announcements across all active enrolled courses for the student
    for example: do i have any announcements
    """

    no_records_message = 'You currently have no announcements.'
    course_announcements = ''

    # Get the user using user_id to match with LMS SIS_ID
    try: 
        user = getCanvasUser (canvas, student_user_name)
    except:
        return user_not_found_error (event)

    course_names = []
    if user:
        courses = user.get_courses(enrollment_status='active')
    
        # Loop through the courses.
        for course in courses:
            course_names.append(course.name)
            # get_announcements returns a list of discussion topics.
            for discussion_topic in canvas.get_announcements(context_codes=[course.id]): 
                if discussion_topic:
                    announcement_date = datetime.datetime.strftime(discussion_topic.posted_at_date,"%b %d %Y %-I:%M %p")
                    course_announcements += '<li><b>{0}</b>: {1}: <br>{2}. </li>'.format(course.name, discussion_topic.title, discussion_topic.message)
                else:
                    course_announcements += no_records_message

    if course_announcements != '':
        course_announcements = "<ul>" + course_announcements + "</ul>"

    result = {"Announcements": course_announcements}

    if result['Announcements']:
        return_message = 'Here are your announcements: {}'.format(result['Announcements'])
        set_alt_message (event, return_message)
    else:
        set_alt_message (event, no_records_message)

    return event


def query_grades_for_student(event, canvas, student_user_name, course_name_to_filter):
    """
    function: query_grades_for_student
    This function retrieves grade information across all active enrolled courses, or for a particular course, for the student
    for example: tell me about my grades, or how did i do in {course name}
    """

    no_records_message = "There are no enrolled courses."
    course_grades = '<ul>'
    # Get the user using user_id to match with LMS SIS_ID
    try: 
        user = getCanvasUser (canvas, student_user_name)
    except:
        return user_not_found_error (event)

    if user:
        # Loop through the courses
        courses = user.get_enrollments(include='current_points', search_by='course')

        if courses: 
            for grade in courses:
                course_name = canvas.get_course(grade.course_id)
                if grade.grades['current_score'] != '':
                    grade_score = grade.grades['current_score']
                else:
                    grade_score = "N/A"

                #check for matching course_name_slot_input with course names
                if course_name_to_filter != '' and course_name.name.upper().strip() == course_name_to_filter.upper():
                    course_grades = "<li>Grades for {} course: {}. </li>".format(course_name.name, grade_score)
                    break
                elif course_name_to_filter != '':
                    # if a slot value is provided, but does not have a matching course that the student is enrolled in
                    course_grades = "Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses."
                else:
                    course_grades += "<li>Grades for {} course: {}. </li>".format(course_name.name, grade_score)
        else:
            course_grades = no_records_message

        course_grades += "</ul>"

    result = {"Grades": course_grades}

    return_message = result['Grades']
    set_alt_message (event, return_message)

    return event


def query_syllabus_for_student(event, canvas, student_user_name, course_name_to_filter):
    """
    function: query_syllabus_for_student
    This function retrieves syllabus information across all active enrolled courses, or for a particular course, for the student
    for example: what is my syllabus, or tell me about my {course name} syllabus
    """

    no_records_message = 'There is no syllabus currently available for this course.'
    course_syllabus = ''

    # Get the user using user_id to match with LMS SIS_ID
    try: 
        user = getCanvasUser (canvas, student_user_name)
    except:
        return user_not_found_error (event)

    if user:
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])

        # Loop through the courses
        if courses: 
            # Loop through the courses.
            for course in courses:
                #check for matching course_name_slot_input with course names
                if course_name_to_filter != '' and course.name.upper().strip() == course_name_to_filter.upper():
                    if course.syllabus_body.strip() != '':
                        course_syllabus = '<b>{0}</b>: {1}<br>'.format(course.name, course.syllabus_body)
                    else:
                        course_syllabus = no_records_message
                    break
                elif course_name_to_filter != '':
                    # if a slot value is provided, but does not have a matching course that the student is enrolled in
                    course_syllabus = "Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses."
                else:
                    if course.syllabus_body.strip() != '':
                        course_syllabus += '<b>{0}</b>: {1}. <br>'.format(course.name, course.syllabus_body)
                    else:
                        course_syllabus += '<b>{0}</b>: {1}. <br>'.format(course.name, no_records_message)

    result = {"CourseSyllabus": course_syllabus}

    return_message = result['CourseSyllabus']
    set_alt_message (event, return_message)

    return event


def validate_input(event):
    """
    function: validate_input
    This function checks whether the user is logged in
    Additionally, also checks if QnABot is configured with the required parameters
    """

    error_message = ''

    try:
        if json.loads(event['res']['result']['args'][0])['Query'] == '':
            error_message = 'There was an error processing your request. Please check the question setup and try again.' 
            return error_message

        if event['req']['_userInfo']['isVerifiedIdentity'] != "true": 
            error_message = 'There was an error processing your request. Please check your login and try again, or contact your administrator.'
            return error_message

        if event['req']['_settings']['CanvasDomainName'].strip() == '' or event['req']['_settings']['CanvasAPIKey'].strip() == '' or event['req']['_settings']['CanvasCourseNameSlot'].strip() == '':
            error_message = 'There was an error processing your request. Please check the QnABot custom setting names/values and try again.'
            return error_message
    except:
        return error_message


def remove_HTML_tags (strInput):
    """
    function to remove HTML tags
    """

    #parse html input string
    objBSoup = BeautifulSoup(strInput, "html.parser")

    for data in objBSoup (['style', 'script']):
        #remove html tags
        data.decompose()
  
    # return
    return ' '.join(objBSoup.stripped_strings)


def get_SSML_output (strInput):
    """
    function to return SSML output
    """

    #parse html input string
    return "<speak>" + remove_HTML_tags(strInput) + "</speak>"


def set_alt_message (event, strInput):
    """
    function to set alt messages
    """

    # set markdown output
    event['res']['session']['appContext']['altMessages']['markdown'] = strInput
    # set ssml output
    event['res']['session']['appContext']['altMessages']['ssml'] = get_SSML_output (strInput)


def user_not_found_error(event): 
    """
    function to return error message when user id does not exist in Canvas LMS
    """

    print ("user_not_found_error")
    return_message = "There was an error processing your request. Please check your login and try again, or contact your administrator."
    set_alt_message (event, return_message)

    return event