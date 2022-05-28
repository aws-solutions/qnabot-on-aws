# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0


# Import the Canvas class
import canvasapi
from canvasapi import Canvas

from CanvasLMSHelper import *


api_token = '' #variable to hold the value of API_Token stored in AWS Secrets Manager
canvas = None   #variable to hold the Canvas object


"""
function handler
Main handler function
This function processes:
a. lambda hook arguments
b. processes user input
c. provides response back to the user
"""
def handler(event, context):
    global api_token
    global canvas

    return_message = ''
    course_name_slot_input = ''
    course_name_slot_resolved_input = ''
    course_name_to_filter = ''

    # Validate the required input.
    error_message = validate_input(event)

    if error_message:
        return_message = error_message
        set_alt_message (event, return_message)
    else:
        # get the API domain. This will be needed for API calls and for looking up the bearer token.
        domain = event['req']['_settings']['CanvasLMS_DomainName'].strip()
        secrets_name = event['req']['_settings']['CanvasLMS_APIKey'].strip()
        course_name_slot = event['req']['_settings']['CanvasLMS_CourseNameSlot'].strip()

        try: 
            # get slot value if present
            course_name_slot_input = event["req"]["_event"]["interpretations"][0]["intent"]["slots"][course_name_slot]["value"].get("originalValue", '')
        except:
            course_name_slot_input = ''

        course_name_slot_resolved_input = event["req"]["slots"].get(course_name_slot, '')
        course_name_to_filter = course_name_slot_resolved_input

        if (course_name_slot_resolved_input == '' and course_name_slot_input != ''):
            return_message = "Sorry, was unable to find the course you are looking for. Check the course name and try again."
            set_alt_message (event, return_message)
            return event


        # Get the API Token from AWS Secrets Manager
        if api_token == '':
            api_token = get_secret(secrets_name)

        # Initialize Canvas object
        if canvas is None:
            canvas = Canvas(domain, api_token)

        try:
            # Get the student's profile from the request
            student_user_name = event['req']['_userInfo']['UserName']
            student_name = event['req']['_userInfo']['GivenName']

            # Get the query from the request (lambda function argument)
            query = json.loads(event['res']['result']['args'][0])['Query']
            if query == 'CanvasMenu':
                # retrieve the menu
                return query_menu (event, student_name)
            elif query == 'CourseEnrollments':
                # retrieve the course options for this student.
                return query_enrollments_for_student(event, canvas, student_user_name)
            elif query == 'CourseAssignments':
                # retrieve the assignments for this student.
                return query_course_assignments_for_student(event, canvas, student_user_name, course_name_to_filter)
            elif query == 'SyllabusForCourse':
                # retrieve the course syllabus for this student.
                return query_syllabus_for_student(event, canvas, student_user_name, course_name_to_filter)
            elif query == 'CoursesForStudent':
                # retrieve the course options for this student.
                return query_courses_for_student(event, canvas, student_user_name, course_name_to_filter)
            elif query == 'AnnouncementsForStudent':
                # retrieve the announcements for this student.
                return query_announcements_for_student(event, canvas, student_user_name)
            elif query == 'GradesForStudent':
                # retrieve the course grades for this student.
                return query_grades_for_student(event, canvas, student_user_name, course_name_to_filter)
            else: 
                return_message = 'There was an error processing your request. For a list of available options, type or say <i>canvas menu</i>.' 
                set_alt_message (event, return_message)
                return event
        except ValueError as e:
            print ("ERROR: "+ str(e))  #print the exception
            return_message = 'There was an error processing your request. Please contact your administrator.'
            set_alt_message (event, return_message)
            return event

    return event
