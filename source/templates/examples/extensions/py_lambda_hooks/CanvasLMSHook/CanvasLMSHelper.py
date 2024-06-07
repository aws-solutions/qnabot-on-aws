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

# NOTICE: Canvas LMS integration with QnABot on AWS is deprecated in this release and no longer be supported. Customers may fork the code needed for their specific use case from previous versions. The integration code will be removed in the next release.

import json
import os
import boto3
import base64
import datetime
import calendar
from botocore import config

from bs4 import BeautifulSoup
from botocore.exceptions import ClientError

CONTENT_TYPE = 'application/vnd.amazonaws.card.generic'
TITLE = 'response buttons'
SSML_PREOUTPUT = 'Please select one of these options: '
NOT_FOUND_RESP = 'Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses.'

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
        config= config.Config(region_name=region_name,
            user_agent_extra = f"AWSSOLUTION/{os.environ['SOLUTION_ID']}/{os.environ['SOLUTION_VERSION']} AWSSOLUTION-CAPABILITY/{os.environ['SOLUTION_ID']}-C018/{os.environ['SOLUTION_VERSION']}"))

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


def get_canvas_user (param_canvas, param_user_name):
    """
    function to get Canvas User
    This function retrieves the Canvas user by using the SIS Login ID
    """

    user = param_canvas.get_user(param_user_name, 'sis_login_id')
    return user


def query_menu (event, student_name):  # NOSONAR param passed from upstream
    """
    function to get menu
    """

    # provide a menu to choose from (announcements, enrollments, syllabus, assignments, grades)
    choicelist = [{'text':'Announcements','value':"tell me about my announcements"}, {'text':'Course Enrollments','value':"tell me about my enrollments"}, {'text':'Course Syllabus','value':"tell me about my syllabus"}, {'text':'Assignments','value':"tell me about my assignments"}, {'text':'Grades','value':"tell me about my grades"}]
    generic_attachments = {'version': '1','contentType': CONTENT_TYPE,'genericAttachments':[{"title": TITLE,"buttons":choicelist}]}
    event['res']['session']['appContext']['responseCard'] = generic_attachments
    event['res']['session']['appContext']['altMessages']['markdown'] = "Please select one of the options below:"  # NOSONAR Do not need a literal

    int_counter = 0
    str_choice_list = ""
    for _ in choicelist:
        if str_choice_list != '':
            str_choice_list = str_choice_list + ", "
        str_choice_list = str_choice_list + choicelist[int_counter]['text']
        int_counter = int_counter + 1
    event['res']['session']['appContext']['altMessages']['ssml'] = get_ssml_output(SSML_PREOUTPUT + str_choice_list)

    return event


def query_enrollments_for_student(event, canvas, student_user_name):
    """
    function: query_enrollments_for_student
    This function retrieves students' active enrollments
    """

    # Get the user using user_id to match with LMS SIS_ID
    try:
        user = get_canvas_user (canvas, student_user_name)
    except:  # NOSONAR Function to log exception already implemented
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
        generic_attachments = {'version': '1','contentType': CONTENT_TYPE,'genericAttachments':[{"title":TITLE,"buttons":choicelist}]}
        event['res']['session']['appContext']['responseCard'] = generic_attachments
        event['res']['session']['appContext']['altMessages']['markdown'] = "Please select one of the options below:"

        int_counter = 0
        str_choice_list = ""
        for _ in choicelist:
            if str_choice_list != '':
                str_choice_list = str_choice_list + ", "
            str_choice_list = str_choice_list + choicelist[int_counter]['text']
            int_counter = int_counter + 1
        event['res']['session']['appContext']['altMessages']['ssml'] = get_ssml_output(SSML_PREOUTPUT + str_choice_list)
    else:
        return_message = "You are not currently enrolled in any courses."
        set_alt_message (event, return_message)

    return event

def is_not_filtered_course(course_name_to_filter, course):
    return course_name_to_filter != '' and course.name.upper().strip() != course_name_to_filter.upper()

def is_filtered_course(course_name_to_filter, course):
    return course_name_to_filter != '' and course.name.upper().strip() == course_name_to_filter.upper()

def get_course_result(course_name_to_filter, user):
    bln_found_course = False
    if user:
        courses = user.get_courses(enrollment_status='active')
        # Loop through the courses.
        for course in courses:
            if is_filtered_course(course_name_to_filter, course):
                result = {"Choice": course.name}
                bln_found_course = True
                break
        if bln_found_course == False:
            result = {"Choice": 'N/A'}
    else:
        result = {"Choice": 'N/A'}
    return result

def query_courses_for_student(event, canvas, student_user_name, course_name_to_filter):
    """
    function: query_courses_for_student
    This function retrieves course options across all active enrolled courses, or for a particular course, for the student
    for example: more information about {course name}
    """

    # Get the user using user_id to match with LMS SIS_ID
    try:
        user = get_canvas_user (canvas, student_user_name)
    except:  # NOSONAR Function to log exception already implemented
        return user_not_found_error (event)

    result = get_course_result(course_name_to_filter, user)

    returned_course = result['Choice']
    if returned_course == 'N/A':
        return_message = NOT_FOUND_RESP

        set_alt_message (event, return_message)
    else:
        generic_attachment = ['assignments','syllabus','grades']
        choice_list = []
        for i in generic_attachment:
            choice_list.append({'text':'{} {}'.format(returned_course,i),'value':'tell me about my {} {}'.format(returned_course,i)})
        generic_attachments = {'version': '1','contentType': CONTENT_TYPE,'genericAttachments':[{"title":TITLE,"buttons":choice_list}]}
        event['res']['session']['appContext']['responseCard'] = generic_attachments
        event['res']['session']['appContext']['altMessages']['markdown'] = "Please select one of the options below:"

        int_counter = 0
        str_choice_list = ""
        for _ in choice_list:
            if str_choice_list != '':
                str_choice_list = str_choice_list + ", "
            str_choice_list = str_choice_list + choice_list[int_counter]['text']
            int_counter = int_counter + 1
        event['res']['session']['appContext']['altMessages']['ssml'] = get_ssml_output(SSML_PREOUTPUT + str_choice_list)
    return event

def append_assignment_due_date(assignment):
    if assignment.due_at:   #check if assignments have due dates
        due_date = datetime.datetime.strptime(assignment.due_at,'%Y-%m-%dT%H:%M:%SZ')
        due_date_string = '{0}, {1} {2}, {3}'.format(calendar.day_name[due_date.weekday()], due_date.strftime("%B"), due_date.strftime("%-d"), due_date.strftime("%Y"))
        return "<li>{} -- is due: {}. </li>".format(assignment.name, due_date_string)
    else:
        return "<li>{} -- has no due date. </li>".format(assignment.name)

def get_course_assignments(course_name_to_filter, no_records_message, user):
    course_assignments = ''
    bln_has_assignments = False
    bln_found_match = False
    courses = user.get_courses(enrollment_status='active')

    for course in courses:
        bln_has_assignments = False
        bln_found_match = False

            #check for matching course_name_slot_input with course names
        if is_filtered_course(course_name_to_filter, course):
            bln_found_match = True

        if bln_found_match == True:
            course_assignments = "<b>" + course.name + ": </b> <ul>"
        else:
            course_assignments += "<b>" + course.name + ": </b> <ul>"

            # Loop through the assignments that have not been submitted
        for assignment in course.get_assignments(bucket='unsubmitted'):
            bln_has_assignments = True
            if is_not_filtered_course(course_name_to_filter, course):
                    # if a slot value is provided, but does not have a matching course that the student is enrolled in
                course_assignments = NOT_FOUND_RESP
                break

            course_assignments += append_assignment_due_date(assignment)

        if bln_has_assignments == False:
            course_assignments += no_records_message

        course_assignments += "</ul><br>"

            #if found a matching course, then break from the course For loop
        if bln_found_match == True:
            break
    return course_assignments

def query_course_assignments_for_student(event, canvas, student_user_name, course_name_to_filter):
    """
    function: query_course_assignments_for_student
    This function retrieves assignment information across all active enrolled courses, or for a particular course, for the student
    for example: do i have any assignments due or tell me about by {course_name} assignments
    """

    no_records_message = 'There are no assignments for this course.'
    # Get the user using user_id to match with LMS SIS_ID
    try:
        user = get_canvas_user (canvas, student_user_name)
    except:  # NOSONAR Function to log exception already implemented
        return user_not_found_error (event)

    if user:
        course_assignments = get_course_assignments(course_name_to_filter, no_records_message, user)
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
        user = get_canvas_user (canvas, student_user_name)
    except:  # NOSONAR Function to log exception already implemented
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
                    announcement_date = datetime.datetime.strftime(discussion_topic.posted_at_date,"%b %d %Y %-I:%M %p")  # NOSONAR storing the date in string
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

def get_grade_score(grade):
    if grade.grades['current_score'] != '':
        grade_score = grade.grades['current_score']
    else:
        grade_score = "N/A"
    return grade_score

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
        user = get_canvas_user (canvas, student_user_name)
    except:  # NOSONAR Function to log exception already implemented
        return user_not_found_error (event)

    if user:
        # Loop through the courses
        courses = user.get_enrollments(include='current_points', search_by='course')

        if courses:
            for grade in courses:
                course_name = canvas.get_course(grade.course_id)
                grade_score = get_grade_score(grade)

                #check for matching course_name_slot_input with course names
                if is_filtered_course(course_name_to_filter, course_name):
                    course_grades = "<li>Grades for {} course: {}. </li>".format(course_name.name, grade_score)
                    break
                elif course_name_to_filter != '':
                    # if a slot value is provided, but does not have a matching course that the student is enrolled in
                    course_grades = NOT_FOUND_RESP
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
        user = get_canvas_user (canvas, student_user_name)
    except:  # NOSONAR Function to log exception already implemented
        return user_not_found_error (event)

    if user:
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])

    # Loop through the courses.
    for course in courses:
        #check for matching course_name_slot_input with course names
        if is_filtered_course(course_name_to_filter, course):
            if course.syllabus_body.strip() != '':
                course_syllabus = '<b>{0}</b>: {1}<br>'.format(course.name, course.syllabus_body)
            else:
                course_syllabus = no_records_message
            break
        elif course_name_to_filter != '':
            # if a slot value is provided, but does not have a matching course that the student is enrolled in
            course_syllabus = NOT_FOUND_RESP
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
    except Exception as e:
        print("validate_input exception")
        print(e)
        error_message = 'There was an error processing your request. Please check the question setup and try again.'
        return error_message


def remove_html_tags (str_input):
    """
    function to remove HTML tags
    """

    #parse html input string
    obj_b_soup = BeautifulSoup(str_input, "html.parser")

    for data in obj_b_soup (['style', 'script']):
        #remove html tags
        data.decompose()

    # return
    return ' '.join(obj_b_soup.stripped_strings)


def get_ssml_output (str_input):
    """
    function to return SSML output
    """

    #parse html input string
    return "<speak>" + remove_html_tags(str_input) + "</speak>"


def set_alt_message (event, str_input):
    """
    function to set alt messages
    """

    # set markdown output
    event['res']['session']['appContext']['altMessages']['markdown'] = str_input
    # set ssml output
    event['res']['session']['appContext']['altMessages']['ssml'] = get_ssml_output (str_input)


def user_not_found_error(event):
    """
    function to return error message when user id does not exist in Canvas LMS
    """

    print ("user_not_found_error")
    return_message = "There was an error processing your request. Please check your login and try again, or contact your administrator."
    set_alt_message (event, return_message)

    return event
