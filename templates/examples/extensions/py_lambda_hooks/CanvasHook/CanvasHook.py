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

#----------------------------------------------------------------------
# function: get_secret
#----------------------------------------------------------------------
def get_secret(secrets_id_name):

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
            SecretId=secrets_id_name
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'DecryptionFailureException':
            # Secrets Manager can't decrypt the protected secret text using the provided KMS key.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InternalServiceErrorException':
            # An error occurred on the server side.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            # You provided an invalid value for a parameter.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            # You provided a parameter value that is not valid for the current state of the resource.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
        elif e.response['Error']['Code'] == 'ResourceNotFoundException':
            # We can't find the resource that you asked for.
            # Deal with the exception here, and/or rethrow at your discretion.
            raise e
    else:
        # Decrypts secret using the associated KMS CMK.
        # Depending on whether the secret is a string or binary, one of these fields will be populated.
        if 'SecretString' in get_secret_value_response:
            secret = get_secret_value_response['SecretString']
        else:
            decoded_binary_secret = base64.b64decode(get_secret_value_response['SecretBinary'])

    #return the API token
    return json.loads(get_secret_value_response['SecretString'])['API_Token']


#----------------------------------------------------------------------
# function to get Canvas User by using  user_id to match with LMS SIS_ID
#----------------------------------------------------------------------

def getCanvasUser (param_canvas, param_user_name):
    user = param_canvas.get_user(param_user_name, 'sis_login_id')
    return user

#----------------------------------------------------------------------
# function: query_enrollments_for_student
#----------------------------------------------------------------------
def query_enrollments_for_student(canvas, student_user_name, userinput):
    enrollments_for_student = 'You are not currently enrolled in any courses.'

    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)

    if user:
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])

        course_name = []
        if courses: 
            # Loop through the courses.
            for course in courses:
                course_name.append(course.name)

    result = {"CourseNames": course_name}
    return result
    

#----------------------------------------------------------------------
# function: query_choices_for_student
#----------------------------------------------------------------------
def query_choices_for_student(canvas, student_user_name, userinput):
    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    
    if user:
        courses = user.get_courses(enrollment_status='active')
        if courses: 
            course_name = []
            # Loop through the courses.
            for course in courses:
                course_name.append(course.name)
            choice = process.extractOne(userinput, course_name, scorer=fuzz.token_set_ratio)

    result = {"Choice": choice[0]}
    return result


#----------------------------------------------------------------------
# function: query_course_assignments_for_student
#----------------------------------------------------------------------
def query_course_assignments_for_student(canvas, student_user_name, userinput):
    course_assignments = ''
    blnHasAssignments = False

    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    
    if user:
        course_list = []
        courses = user.get_courses(enrollment_status='active')
    
        # Loop through the courses.
        for course in courses:
            course_list.append(course.name)
        choice = process.extractOne(userinput, course_list, scorer=fuzz.token_set_ratio)

        for course in courses:
            blnHasAssignments = False
            #check for matching userinput with course names
            if course.name == choice[0] and choice[1] > MATCHING_TOLERANCE_SCORE:
                course_assignments = "<b>" + course.name + "</b> <ul>"
                # Loop through the assignments that have not been submitted
                for assignment in course.get_assignments(bucket='unsubmitted'):
                    blnHasAssignments = True
                    if assignment.due_at:
                        due_date = datetime.datetime.strptime(assignment.due_at,'%Y-%m-%dT%H:%M:%SZ')
                        due_date_string = '{0}, {1} {2}, {3}'.format(calendar.day_name[due_date.weekday()], due_date.strftime("%B"), due_date.strftime("%-d"), due_date.strftime("%Y"))
                        course_assignments += "<li>{} -- is due: {}</li>".format(assignment.name, due_date_string)
                    else:
                        course_assignments += "<li>{} -- has no due date</li>".format(assignment.name)
                break
            else:
                # Loop through the assignments that have not been submitted
                course_assignments += "<b>" + course.name + "</b> <ul>"
                for assignment in course.get_assignments(bucket='unsubmitted'):
                    blnHasAssignments = True
                    if assignment.due_at:
                        due_date = datetime.datetime.strptime(assignment.due_at,'%Y-%m-%dT%H:%M:%SZ')
                        due_date_string = '{0}, {1} {2}, {3}'.format(calendar.day_name[due_date.weekday()], due_date.strftime("%B"), due_date.strftime("%-d"), due_date.strftime("%Y"))
                        course_assignments += "<li>{} -- is due: {}</li>".format(assignment.name, due_date_string)
                    else:
                        course_assignments += "<li>{} -- has no due date</li>".format(assignment.name)

            if blnHasAssignments == False:
                course_assignments += "There are no assignments for this course."

            course_assignments += "</ul><br>"

    result = {"CourseAssignments": course_assignments}
    return result


#----------------------------------------------------------------------
# function: query_announcements_for_student
#----------------------------------------------------------------------
def query_announcements_for_student(canvas, student_user_name, userinput):
    course_announcements = '<ul>'

    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)

    course_list = []
    if user:
        courses = user.get_courses(enrollment_status='active')
    
        # Loop through the courses.
        for course in courses:
            course_list.append(course.name)
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

#----------------------------------------------------------------------
# function: query_grades_for_student
#----------------------------------------------------------------------
def query_grades_for_student(canvas, student_user_name, userinput):
    course_grades = '<ul>'
    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    
    if user:
        course_list = []
        courses = user.get_courses(enrollment_status='active')

        for course in courses:
            course_list.append(course.name)
        choice = process.extractOne(userinput, course_list, scorer=fuzz.token_set_ratio)
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

#----------------------------------------------------------------------
# function: query_syllabus_for_student
#----------------------------------------------------------------------
def query_syllabus_for_student(canvas, student_user_name, userinput):
    no_syllabus = 'There is no syllabus currently available for this course.'
    course_syllabus = ''

    # Get the user using user_id to match with LMS SIS_ID
    user = getCanvasUser (canvas, student_user_name)
    if user:
        course_list = []
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])
        
        for course in courses:
            course_list.append(course.name)
        choice = process.extractOne(userinput, course_list, scorer=fuzz.token_set_ratio)

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


#----------------------------------------------------------------------
# function: validate_input
#----------------------------------------------------------------------
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


#----------------------------------------------------------------------
# function handler
#----------------------------------------------------------------------
def handler(event, context):
    userinput = event["req"]["_event"]["inputTranscript"]
    return_message = ''

    # Validate the required input.
    error_message = validate_input(event)

    if error_message:
        return_message = error_message
        #event['res']['message'] = return_message
        event['res']['session']['appContext']['altMessages']['markdown'] = return_message
    else:
        # Get the API domain. This will be need for API calls and for looking up the bearer token.
        domain = event['req']['_settings']['CanvasDomainName']
        secrets_id_name = event['req']['_settings']['CanvasAPIKey']

        # Get the bearer token from Secrets Manager.
        api_token = get_secret(secrets_id_name)

        # Initialize a new Canvas object
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
            elif query == 'ChoicesForStudent':
                # Retrieve the course options for this student.
                result = query_choices_for_student(canvas, student_user_name, userinput)
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
        except ValueError as e:
            return_message = str(e)
  
    # Return the result.
    return event