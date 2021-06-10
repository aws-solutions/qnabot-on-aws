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


# Import the Canvas class
import canvasapi
from canvasapi import Canvas


#----------------------------------------------------------------------
# function: get_secret
#----------------------------------------------------------------------


def get_secret(secrets_id_name,domain):

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

    if secrets_id_name:
        print(secrets_id_name)
        
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

    # Your code goes here.
    return json.loads(get_secret_value_response['SecretString'])[domain]


#----------------------------------------------------------------------
# function: query_enrollments_for_student
#----------------------------------------------------------------------
def query_enrollments_for_student(canvas, student_email_address, userinput):
    print(student_email_address)


    enrollments_for_student = 'You are not currently enrolled in any courses.'

 
    account = canvas.get_accounts()
    for i in account:
    user = account.get_users(urllib.parse.quote(student_email_address))
    
    if user:
        user = canvas.get_user(user[0].id)
        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])

        course_name = []
        if courses: 

            # Loop through the courses.
            for course in courses:
                course_name.append(course.name)



    result = {"CourseNames": course_name}

    return result
    

def query_choices_for_student(canvas, student_email_address, userinput):

    account = canvas.get_accounts()
    for i in account:
    user = account.get_users(urllib.parse.quote(student_email_address))
    
    if user:
        user = canvas.get_user(user[0].id)
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
# function: query_assignment_due_dates
#----------------------------------------------------------------------
def query_assignment_due_dates(canvas, student_email_address, userinput):

    assignment_due_dates = '<ul>'

    # Get the user from the email address
    account = canvas.get_accounts()
    for i in account:
    user = account.get_users(urllib.parse.quote(student_email_address))
    
    if user:
        user = canvas.get_user(user[0].id)
        course_list = []

            
        courses = user.get_courses(enrollment_status='active')
    
        # Loop through the courses.
        for course in courses:
            course_list.append(course.name)
        choice = process.extractOne(userinput, course_list, scorer=fuzz.token_set_ratio)

        for course in courses:
            if course.name == choice[0]:
                
                
                

            # Loop through the assignments.
                looper = []
                for assignment in user.get_assignments(course.id):
                    looper.append(assignment)
                
                if looper:
                    assignment_due_dates = "|Assignment|Due Date|\n|:------------|:-----------------:|"
                    for assignment in user.get_assignments(course.id):
                        
                        
        
                        # Get the assignment so we can retrieve the due date.
                        course_assignment = course.get_assignment(assignment.id)
        
                        due_date_string = 'has no due date'
                        if course_assignment.due_at and datetime.datetime.strptime(course_assignment.due_at,'%Y-%m-%dT%H:%M:%SZ') >= datetime.datetime.now():
    
                            due_date = datetime.datetime.strptime(course_assignment.due_at,'%Y-%m-%dT%H:%M:%SZ')
                            due_date_string = '{0}, {1} {2}'.format(calendar.day_name[due_date.weekday()], due_date.strftime("%B"), due_date.strftime("%-d"))
        
                            assignment_due_dates += "\n|    {}      |  {}      |".format(assignment.name, due_date_string)


                    assignment_due_dates += '</ul>'
                else:
                    assignment_due_dates = ''

    result = {"AssignmentDueDates": assignment_due_dates}

    return result


#----------------------------------------------------------------------
# function: query_announcements_for_student
#----------------------------------------------------------------------
def query_announcements_for_student(canvas, student_email_address, userinput):


    course_announcements = '<ul>'

    # Get the user from the email address
    # user = canvas.get_user_by_email_address(urllib.parse.quote(student_email_address))
    course_list = []
    if user:
        courses = user.get_courses(enrollment_status='active')
    
        # Loop through the courses.
        for course in courses:
            course_list.append(course.name)
            for discussion_topic in canvas.get_announcements(course.id): 
                if discussion_topic:
                    announcement_date = datetime.datetime.strftime(discussion_topic.posted_at_date,"%b %d %Y %-I:%M %p")
                    course_announcements += '<li>For {0}, "{1} on {2}"</li>'.format(course.name, discussion_topic.title, announcement_date )
                else:
                    course_announcements += 'You currently have no announcements'
                        

            # get_announcements returns a list of discussion topics.


    course_announcements += '</ul>'

    result = {"Announcements": course_announcements}

    return result

#----------------------------------------------------------------------
# function: query_grades_for_student
#----------------------------------------------------------------------
def query_grades_for_student(canvas, student_email_address, userinput):


    # Get the user from the email address
    account = canvas.get_accounts()
    for i in account:
    user = account.get_users(urllib.parse.quote(student_email_address))
    
    if user:
        user = canvas.get_user(user[0].id)
        course_list = []

        courses = user.get_enrollments(include='current_points', search_by='course')
        course_grades = "|Course|Grade|\n|:------------|:-----------------:|"
        for grade in courses:
            class_name = canvas.get_course(grade.course_id)
            course_grades += "\n|    {}      |  {}      |".format(class_name.name, grade.grades['current_score'])

            # get_announcements returns a list of discussion topics.



    result = {"Grades": course_grades}
    return result

#----------------------------------------------------------------------
# function: query_syllabus_for_student
#----------------------------------------------------------------------
def query_syllabus_for_student(canvas, student_email_address, userinput):

    no_syllabus = 'There is no syllabus currently available for this course.'

    account = canvas.get_accounts()
    for i in account:
    user = account.get_users(urllib.parse.quote(student_email_address))
    
    if user:
        user = canvas.get_user(user[0].id)
        user = canvas.get_user(user.id)
        course_list = []

        courses = user.get_courses(enrollment_status='active',include=['syllabus_body'])
        
        for course in courses:
            course_list.append(course.name)
        choice = process.extractOne(userinput, course_list, scorer=fuzz.token_set_ratio)

        if courses: 
            
            # Loop through the courses.
            for course in courses:
                if course.name == choice[0]:
                    if course.syllabus_body:
                        course_syllabus = "{}/courses/{}/assignments/syllabus".format(domain,course.id)
                    else:
                        course_syllabus = 'There is no syllabus posted for this course'



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
def lambda_handler(event, context):
    print('hello world')
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
        print(domain + ' ' + secrets_id_name)

        # Get the bearer token from Secrets Manager.
        api_token = get_secret(secrets_id_name,domain)
        print(api_token)

        # Initialize a new Canvas object
        canvas = Canvas(domain, api_token)
        

        try:

            # Get the student's email address from the request.
            student_email_address = event['req']['_userInfo']['Email']
            student_name = event['req']['_userInfo']['GivenName']
            


            
                

            # Get the query from the request.
            query = json.loads(event['res']['result']['args'][0])['Query']

            # Determine what the query is.
            if query == 'AssignmentDueDates':

                # Retrieve the due dates for this student.
                result = query_assignment_due_dates(canvas, student_email_address, userinput)
                
                if result['AssignmentDueDates']:
                    return_message = result['AssignmentDueDates']
                    event['res']['session']['appContext']['altMessages']['markdown'] = return_message
                else:
                    event['res']['session']['appContext']['altMessages']['markdown'] = "There are no upcoming assignments for this course."
                
                    
            elif query == 'EnrollmentsForStudent':

                # Retrieve the enrollments for this student.
                result = query_enrollments_for_student(canvas, student_email_address, userinput)

                return_courses = result['CourseNames']
                
                if return_courses:
                    
                    choicelist = [{'text':'Announcements','value':"tell me about my announcements"},{'text':'Grades','value':"tell me about my grades"}]
                    for i in return_courses:
                        choicelist.append({'text':i,'value':"more info on my {} class".format(i)})
                    genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
                    event['res']['session']['appContext']['responseCard'] = genericAttachments
                    event['res']['session']['appContext']['altMessages']['markdown'] = "{}, please select one on of the options below".format(student_name)

                
                else:
                    event['res']['session']['appContext']['altMessages']['markdown'] = "{} You are not currently enrolled in any courses".format(student_name)
                
            elif query == 'SyllabusForCourse':

                # Retrieve the enrollments for this student.
                result = query_syllabus_for_student(canvas, student_email_address, userinput)
                event['res']['session']['appContext']['altMessages']['markdown'] = result['CourseSyllabus']
                
            elif query == 'ChoicesForStudent':

                # Retrieve the enrollments for this student.
                result = query_choices_for_student(canvas, student_email_address, userinput)
                returned_course = result['Choice']
                genericattachment = ['assignments','syllabus']
                choicelist = []
                for i in genericattachment:
                    choicelist.append({'text':'{} {}'.format(returned_course,i),'value':'tell me about my {} {}'.format(returned_course,i)})
                genericAttachments = {'version': '1','contentType': 'application/vnd.amazonaws.card.generic','genericAttachments':[{"title":"response buttons","buttons":choicelist}]}
                event['res']['session']['appContext']['responseCard'] = genericAttachments


                

            elif query == 'AnnouncementsForStudent':

                # Retrieve the announcements for this student.
                result = query_announcements_for_student(canvas, student_email_address, userinput)
                
                if result['Announcements']:
                    return_message = '{} I have listed your announcements below {}'.format(student_name,result['Announcements'])
                    event['res']['session']['appContext']['altMessages']['markdown'] = return_message
                
                else:
                    event['res']['session']['appContext']['altMessages']['markdown'] = "You dont have any announcements at this moment"
                    
                
            elif query == 'GradesForStudent':

                # Retrieve the announcements for this student.
                result = query_grades_for_student(canvas, student_email_address, userinput)

                return_message = result['Grades']
                event['res']['session']['appContext']['altMessages']['markdown'] = return_message


        except ValueError as e:
            return_message = str(e)
  
    # Return the result.
    return event