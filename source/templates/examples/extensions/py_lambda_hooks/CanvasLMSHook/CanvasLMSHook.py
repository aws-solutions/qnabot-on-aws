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

# Import the Canvas class
from canvasapi import Canvas

import CanvasLMSHelper as CanvasLMS


api_token = '' #variable to hold the value of API_Token stored in AWS Secrets Manager
canvas = None   #variable to hold the Canvas object


def handler(event, context):  # NOSONAR Lambda Handler
    """
    function handler
    Main handler function
    This function processes:
    a. lambda hook arguments
    b. processes user input
    c. provides response back to the user
    """

    global api_token
    global canvas

    return_message = ''
    course_name_slot_input = ''
    course_name_slot_resolved_input = ''
    course_name_to_filter = ''

    # Validate the required input.
    error_message = CanvasLMS.validate_input(event)

    if error_message:
        return_message = error_message
        CanvasLMS.set_alt_message (event, return_message)
    else:
        # get the API domain. This will be needed for API calls and for looking up the bearer token.
        domain = event['req']['_settings']['CanvasLMS_DomainName'].strip()
        secrets_name = event['req']['_settings']['CanvasLMS_APIKey'].strip()
        course_name_slot = 'CanvasLMS_course_name_slot'

        try:
            # get slot value if present
            course_name_slot_input = event["req"]["_event"]["interpretations"][0]["intent"]["slots"][course_name_slot]["value"].get("originalValue", '')
        except: # NOSONAR the case is handled and no exception is needed
            course_name_slot_input = ''

        course_name_slot_resolved_input = event["req"]["slots"].get(course_name_slot, '')
        course_name_to_filter = course_name_slot_resolved_input

        if (course_name_slot_resolved_input == '' and course_name_slot_input != ''):
            return_message = "Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses."
            CanvasLMS.set_alt_message (event, return_message)
            return event


        # Get the API Token from AWS Secrets Manager
        if api_token == '':
            api_token = CanvasLMS.get_secret(secrets_name)

        # Initialize Canvas object
        if canvas is None:
            canvas = Canvas(domain, api_token)

        try:
            # Get the student's profile from the request
            student_user_name = event['req']['_userInfo']['UserName']
            student_name = event['req']['_userInfo']['GivenName']

            # Get the query from the request (lambda function argument)
            query = CanvasLMS.json.loads(event['res']['result']['args'][0])['Query']
            match query:
                case 'CanvasMenu':
                # retrieve the menu
                    return CanvasLMS.query_menu (event, student_name)
                case'CourseEnrollments':
                    # retrieve the course options for this student.
                    return CanvasLMS.query_enrollments_for_student(event, canvas, student_user_name)
                case 'CourseAssignments':
                    # retrieve the assignments for this student.
                    return CanvasLMS.query_course_assignments_for_student(event, canvas, student_user_name, course_name_to_filter)
                case 'SyllabusForCourse':
                    # retrieve the course syllabus for this student.
                    return CanvasLMS.query_syllabus_for_student(event, canvas, student_user_name, course_name_to_filter)
                case 'CoursesForStudent':
                    # retrieve the course options for this student.
                    return CanvasLMS.query_courses_for_student(event, canvas, student_user_name, course_name_to_filter)
                case 'AnnouncementsForStudent':
                    # retrieve the announcements for this student.
                    return CanvasLMS.query_announcements_for_student(event, canvas, student_user_name)
                case 'GradesForStudent':
                    # retrieve the course grades for this student.
                    return CanvasLMS.query_grades_for_student(event, canvas, student_user_name, course_name_to_filter)
                case _:
                    return_message = 'There was an error processing your request. For a list of available options, type or say <i>canvas menu</i>.'
                    CanvasLMS.set_alt_message (event, return_message)
                    return event
        except ValueError as e:
            print ("ERROR: "+ str(e))  #print the exception
            return_message = 'There was an error processing your request. Please contact your administrator.'
            CanvasLMS.set_alt_message (event, return_message)
            return event

    return event
