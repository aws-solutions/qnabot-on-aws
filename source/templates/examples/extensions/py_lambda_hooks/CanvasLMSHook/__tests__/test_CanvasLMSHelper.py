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

from unittest.mock import Mock
import pytest
import datetime
import json
from botocore.exceptions import ClientError
from moto import mock_secretsmanager

class TestCanvasLMSHelper():

    @mock_secretsmanager
    def test_get_secret_with_secret_string(self, mock_sm):
        from CanvasLMSHelper import get_secret
        mock_sm.create_secret(Name='test', SecretString=json.dumps({'API_Token': 'value'}))
        response = get_secret('test')
        assert response == 'value'

    @mock_secretsmanager
    def test_get_secret_without_secret_string(self):
        from CanvasLMSHelper import get_secret
        try:
            get_secret('test')
        except ClientError as e:
            assert e.args[0] == "An error occurred (ResourceNotFoundException) when calling the GetSecretValue operation: Secrets Manager can't find the specified secret."

    def test_get_canvas_user(self):
        from CanvasLMSHelper import get_canvas_user
        canvas_mock = Mock()
        get_canvas_user(canvas_mock, 'user')
        canvas_mock.get_user.assert_called_with('user', 'sis_login_id')

    def test_query_menu(self):
        from CanvasLMSHelper import query_menu
        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_menu(event, 'user')
        assert response == {'res': {'session': {'appContext': {'responseCard': {'version': '1', 'contentType': 'application/vnd.amazonaws.card.generic', 'genericAttachments': [{'title': 'response buttons', 'buttons': [{'text': 'Announcements', 'value': 'tell me about my announcements'}, {'text': 'Course Enrollments', 'value': 'tell me about my enrollments'}, {'text': 'Course Syllabus', 'value': 'tell me about my syllabus'}, {'text': 'Assignments', 'value': 'tell me about my assignments'}, {'text': 'Grades', 'value': 'tell me about my grades'}]}]}, 'altMessages': {'markdown': 'Please select one of the options below:', 'ssml': '<speak>Please select one of these options: Announcements, Course Enrollments, Course Syllabus, Assignments, Grades</speak>'}}}}}

    def test_query_enrollments_for_student(self):
        from CanvasLMSHelper import query_enrollments_for_student
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock


        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_enrollments_for_student(event, canvas_mock, 'user')
        assert response == {'res': {'session': {'appContext': {'responseCard': {'version': '1', 'contentType': 'application/vnd.amazonaws.card.generic', 'genericAttachments': [{'title': 'response buttons', 'buttons': [{'text': 'course name', 'value': 'more information about my course name course'}]}]}, 'altMessages': {'markdown': 'Please select one of the options below:', 'ssml': '<speak>Please select one of these options: course name</speak>'}}}}}

    def test_query_enrollments_for_student_with_more_than_one_course(self):
        from CanvasLMSHelper import query_enrollments_for_student
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock, course_mock]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock


        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_enrollments_for_student(event, canvas_mock, 'user')
        assert response == {'res': {'session': {'appContext': {'responseCard': {'version': '1', 'contentType': 'application/vnd.amazonaws.card.generic', 'genericAttachments': [{'title': 'response buttons', 'buttons': [{'text': 'course name', 'value': 'more information about my course name course'}, {'text': 'course name', 'value': 'more information about my course name course'}]}]}, 'altMessages': {'markdown': 'Please select one of the options below:', 'ssml': '<speak>Please select one of these options: course name, course name</speak>'}}}}}

    def test_query_enrollments_for_student_with_no_courses(self):
        from CanvasLMSHelper import query_enrollments_for_student
        user_mock = Mock()
        user_mock.get_courses.return_value = []
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock


        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_enrollments_for_student(event, canvas_mock, 'user')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'You are not currently enrolled in any courses.', 'ssml': '<speak>You are not currently enrolled in any courses.</speak>'}}}}}

    def test_query_enrollments_for_missing_student(self):
        from CanvasLMSHelper import query_enrollments_for_student
        canvas_mock = Mock()
        canvas_mock.get_user.side_effect = Exception('user not found')

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }

        response = query_enrollments_for_student(event, canvas_mock, 'user')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There was an error processing your request. Please check your login and try again, or contact your administrator.', 'ssml': '<speak>There was an error processing your request. Please check your login and try again, or contact your administrator.</speak>'}}}}}

    def test_query_courses_for_student(self):
        from CanvasLMSHelper import query_courses_for_student
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock


        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_courses_for_student(event, canvas_mock, 'user', 'course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': {'version': '1', 'contentType': 'application/vnd.amazonaws.card.generic', 'genericAttachments': [{'title': 'response buttons', 'buttons': [{'text': 'course name assignments', 'value': 'tell me about my course name assignments'}, {'text': 'course name syllabus', 'value': 'tell me about my course name syllabus'}, {'text': 'course name grades', 'value': 'tell me about my course name grades'}]}]}, 'altMessages': {'markdown': 'Please select one of the options below:', 'ssml': '<speak>Please select one of these options: course name assignments, course name syllabus, course name grades</speak>'}}}}}

    def test_query_courses_for_student_with_course_not_found(self):
        from CanvasLMSHelper import query_courses_for_student
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock


        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_courses_for_student(event, canvas_mock, 'user', 'missing course')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses.', 'ssml': '<speak>Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask what courses have i enrolled in , to get a list of enrolled courses.</speak>'}}}}}

    def test_query_courses_for_student_when_student_not_found(self):
        from CanvasLMSHelper import query_courses_for_student

        canvas_mock = Mock()
        canvas_mock.get_user.side_effect = Exception('user not found')


        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_courses_for_student(event, canvas_mock, 'user', 'missing course')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There was an error processing your request. Please check your login and try again, or contact your administrator.', 'ssml': '<speak>There was an error processing your request. Please check your login and try again, or contact your administrator.</speak>'}}}}}

    def test_query_courses_for_student_with_empty_student(self):
        from CanvasLMSHelper import query_courses_for_student

        user_mock = ''
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock


        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_courses_for_student(event, canvas_mock, 'user', 'missing course')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses.', 'ssml': '<speak>Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask what courses have i enrolled in , to get a list of enrolled courses.</speak>'}}}}}

    def test_query_course_assignments_for_student(self):
        from CanvasLMSHelper import query_course_assignments_for_student

        assignment1 = Mock()
        assignment2 = Mock()
        assignment1.name = 'assignment 1'
        assignment2.name = 'assignment 2'
        assignment1.due_at = '2020-01-01T00:00:00Z'
        assignment2.due_at = ''
        course_mock = Mock()
        course_mock.name = 'course name'
        course_mock.get_assignments = lambda bucket: [assignment1, assignment2]
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_course_assignments_for_student(event, canvas_mock, 'user', 'course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': '<b>course name: </b> <ul><li>assignment 1 -- is due: Wednesday, January 1, 2020. </li><li>assignment 2 -- has no due date. </li></ul><br>', 'ssml': '<speak>course name: assignment 1 -- is due: Wednesday, January 1, 2020. assignment 2 -- has no due date.</speak>'}}}}}

    def test_query_course_assignments_for_student_unfiltered_course(self):
        from CanvasLMSHelper import query_course_assignments_for_student

        assignment1 = Mock()
        assignment2 = Mock()
        assignment1.name = 'assignment 1'
        assignment2.name = 'assignment 2'
        assignment1.due_at = '2020-01-01T00:00:00Z'
        assignment2.due_at = ''
        course_mock = Mock()
        course_mock.name = 'course name'
        course_mock.get_assignments = lambda bucket: [assignment1, assignment2]
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_course_assignments_for_student(event, canvas_mock, 'user', 'not course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses.</ul><br>', 'ssml': '<speak>Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask what courses have i enrolled in , to get a list of enrolled courses.</speak>'}}}}}

    def test_query_course_assignments_for_student_with_course_with_no_assignments(self):
        from CanvasLMSHelper import query_course_assignments_for_student

        course_mock = Mock()
        course_mock.name = 'course name'
        course_mock.get_assignments = lambda bucket: []
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_course_assignments_for_student(event, canvas_mock, 'user', 'not course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': '<b>course name: </b> <ul>There are no assignments for this course.</ul><br>', 'ssml': '<speak>course name: There are no assignments for this course.</speak>'}}}}}

    def test_query_course_assignments_for_student_with_no_courses(self):
        from CanvasLMSHelper import query_course_assignments_for_student

        user_mock = Mock()
        user_mock.get_courses.return_value = []
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_course_assignments_for_student(event, canvas_mock, 'user', 'not course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There are no assignments for this course.', 'ssml': '<speak>There are no assignments for this course.</speak>'}}}}}

    def test_query_course_assignments_for_student_when_no_student(self):
        from CanvasLMSHelper import query_course_assignments_for_student

        canvas_mock = Mock()
        canvas_mock.get_user.side_effect = Exception('user not found')

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_course_assignments_for_student(event, canvas_mock, 'user', 'not course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There was an error processing your request. Please check your login and try again, or contact your administrator.', 'ssml': '<speak>There was an error processing your request. Please check your login and try again, or contact your administrator.</speak>'}}}}}


    def test_query_announcements_for_student(self):
        from CanvasLMSHelper import query_announcements_for_student

        discussion_topic = Mock()
        discussion_topic.posted_at_date = datetime.datetime.now().date()
        discussion_topic.title = 'title'
        discussion_topic.message = 'do your homework!'
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_announcements = lambda context_codes: [discussion_topic, {}]
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_announcements_for_student(event, canvas_mock, 'user')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'Here are your announcements: <ul><li><b>course name</b>: title: <br>do your homework!. </li>You currently have no announcements.</ul>', 'ssml': '<speak>Here are your announcements: course name : title: do your homework!. You currently have no announcements.</speak>'}}}}}

    def test_query_announcements_for_student_with_no_announcements(self):
        from CanvasLMSHelper import query_announcements_for_student

        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock]
        canvas_mock = Mock()
        canvas_mock.get_announcements = lambda context_codes: []
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_announcements_for_student(event, canvas_mock, 'user')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'You currently have no announcements.', 'ssml': '<speak>You currently have no announcements.</speak>'}}}}}

    def test_query_announcements_for_student_when_no_student(self):
        from CanvasLMSHelper import query_announcements_for_student

        canvas_mock = Mock()
        canvas_mock.get_user.side_effect = Exception('user not found')

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_announcements_for_student(event, canvas_mock, 'user')
        assert response =={'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There was an error processing your request. Please check your login and try again, or contact your administrator.', 'ssml': '<speak>There was an error processing your request. Please check your login and try again, or contact your administrator.</speak>'}}}}}

    def test_query_grades_for_student(self):
        from CanvasLMSHelper import query_grades_for_student

        grade_mock1 = Mock()
        grade_mock1.course_id = '1'
        grade_mock1.grades = {
            'current_score': 100
        }
        grade_mock2 = Mock()
        grade_mock2.course_id = '2'
        grade_mock2.grades = {
            'current_score': ''
        }
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_enrollments.return_value = [grade_mock1, grade_mock2]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock
        canvas_mock.get_course = lambda course_id: course_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_grades_for_student(event, canvas_mock, 'user', '')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': '<ul><li>Grades for course name course: 100. </li><li>Grades for course name course: N/A. </li></ul>', 'ssml': '<speak>Grades for course name course: 100. Grades for course name course: N/A.</speak>'}}}}}

    def test_query_grades_for_student_with_filtered_course(self):
        from CanvasLMSHelper import query_grades_for_student

        grade_mock1 = Mock()
        grade_mock1.course_id = '1'
        grade_mock1.grades = {
            'current_score': 100
        }
        grade_mock2 = Mock()
        grade_mock2.course_id = '2'
        grade_mock2.grades = {
            'current_score': ''
        }
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_enrollments.return_value = [grade_mock1, grade_mock2]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock
        canvas_mock.get_course = lambda course_id: course_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_grades_for_student(event, canvas_mock, 'user', 'course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': '<li>Grades for course name course: 100. </li></ul>', 'ssml': '<speak>Grades for course name course: 100.</speak>'}}}}}

    def test_query_grades_for_student_with_filtered_incorrect_course(self):
        from CanvasLMSHelper import query_grades_for_student

        grade_mock1 = Mock()
        grade_mock1.course_id = '1'
        grade_mock1.grades = {
            'current_score': 100
        }
        course_mock = Mock()
        course_mock.name = 'course name'
        user_mock = Mock()
        user_mock.get_enrollments.return_value = [grade_mock1]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock
        canvas_mock.get_course = lambda course_id: course_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_grades_for_student(event, canvas_mock, 'user', 'missing course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses.</ul>', 'ssml': '<speak>Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask what courses have i enrolled in , to get a list of enrolled courses.</speak>'}}}}}

    def test_query_grades_for_student_with_no_courses(self):
        from CanvasLMSHelper import query_grades_for_student

        user_mock = Mock()
        user_mock.get_enrollments.return_value = []
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_grades_for_student(event, canvas_mock, 'user', '')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There are no enrolled courses.</ul>', 'ssml': '<speak>There are no enrolled courses.</speak>'}}}}}

    def test_query_grades_for_student_with_missing_student(self):
        from CanvasLMSHelper import query_grades_for_student

        canvas_mock = Mock()
        canvas_mock.get_user.side_effect = Exception('user not found')

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_grades_for_student(event, canvas_mock, 'user', '')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There was an error processing your request. Please check your login and try again, or contact your administrator.', 'ssml': '<speak>There was an error processing your request. Please check your login and try again, or contact your administrator.</speak>'}}}}}

    def test_query_syllabus_for_student(self):
        from CanvasLMSHelper import query_syllabus_for_student

        course_mock1 = Mock()
        course_mock1.name = 'course name'
        course_mock1.syllabus_body = 'body'
        course_mock2 = Mock()
        course_mock2.name = 'course name'
        course_mock2.syllabus_body = ''
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock1, course_mock2]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_syllabus_for_student(event, canvas_mock, 'user', '')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': '<b>course name</b>: body. <br><b>course name</b>: There is no syllabus currently available for this course.. <br>', 'ssml': '<speak>course name : body. course name : There is no syllabus currently available for this course..</speak>'}}}}}

    def test_query_syllabus_for_student_with_filter(self):
        from CanvasLMSHelper import query_syllabus_for_student

        course_mock1 = Mock()
        course_mock1.name = 'course name'
        course_mock1.syllabus_body = 'body'
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock1]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_syllabus_for_student(event, canvas_mock, 'user', 'course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': '<b>course name</b>: body<br>', 'ssml': '<speak>course name : body</speak>'}}}}}

    def test_query_syllabus_for_student_with_filtered_course_without_body(self):
        from CanvasLMSHelper import query_syllabus_for_student

        course_mock1 = Mock()
        course_mock1.name = 'course name'
        course_mock1.syllabus_body = ''
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock1]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_syllabus_for_student(event, canvas_mock, 'user', 'course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There is no syllabus currently available for this course.', 'ssml': '<speak>There is no syllabus currently available for this course.</speak>'}}}}}

    def test_query_syllabus_for_student_with_incorrect_filtered_course(self):
        from CanvasLMSHelper import query_syllabus_for_student

        course_mock1 = Mock()
        course_mock1.name = 'course name'
        course_mock1.syllabus_body = ''
        user_mock = Mock()
        user_mock.get_courses.return_value = [course_mock1]
        canvas_mock = Mock()
        canvas_mock.get_user.return_value = user_mock

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_syllabus_for_student(event, canvas_mock, 'user', 'missing course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses.', 'ssml': '<speak>Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask what courses have i enrolled in , to get a list of enrolled courses.</speak>'}}}}}

    def test_query_syllabus_for_student_with_missing_student(self):
        from CanvasLMSHelper import query_syllabus_for_student

        canvas_mock = Mock()
        canvas_mock.get_user.side_effect = Exception('user not found')

        event = {
            'res': {
                'session': {
                    'appContext': {
                        'responseCard': '',
                        'altMessages': {
                            'markdown': ''
                        }
                    }
                }
            }
        }
        response = query_syllabus_for_student(event, canvas_mock, 'user', 'missing course name')
        assert response == {'res': {'session': {'appContext': {'responseCard': '', 'altMessages': {'markdown': 'There was an error processing your request. Please check your login and try again, or contact your administrator.', 'ssml': '<speak>There was an error processing your request. Please check your login and try again, or contact your administrator.</speak>'}}}}}

    def test_validate_input_correct_input(self):
        from CanvasLMSHelper import validate_input
        event = {
            'res': {
                'result': {
                    'args': [
                        json.dumps({
                            'Query': 'test'
                        })
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasDomainName': 'test.com',
                    'CanvasAPIKey': 'test',
                    'CanvasCourseNameSlot': 'test'
                },
                '_userInfo': {
                    'isVerifiedIdentity': 'true',
                },
                'slots': {}
            },
        }

        error = validate_input(event)
        assert error == None

    def test_validate_input_empty_query(self):
        from CanvasLMSHelper import validate_input
        event = {
            'res': {
                'result': {
                    'args': [
                        json.dumps({
                            'Query': ''
                        })
                    ]
                }
            },
        }

        error = validate_input(event)
        assert error == 'There was an error processing your request. Please check the question setup and try again.'

    def test_validate_input_is_not_verified_identity(self):
        from CanvasLMSHelper import validate_input
        event = {
            'res': {
                'result': {
                    'args': [
                        json.dumps({
                            'Query': 'test'
                        })
                    ]
                }
            },
            'req': {
                '_userInfo': {
                    'isVerifiedIdentity': 'false',
                },
                'slots': {}
            },
        }

        error = validate_input(event)
        assert error == 'There was an error processing your request. Please check your login and try again, or contact your administrator.'

    def test_validate_input_missing_canvas_info(self):
        from CanvasLMSHelper import validate_input
        event = {
            'res': {
                'result': {
                    'args': [
                        json.dumps({
                            'Query': 'test'
                        })
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasDomainName': '',
                    'CanvasAPIKey': '',
                    'CanvasCourseNameSlot': ''
                },
                '_userInfo': {
                    'isVerifiedIdentity': 'true',
                },
                'slots': {}
            },
        }

        error = validate_input(event)
        assert error == 'There was an error processing your request. Please check the QnABot custom setting names/values and try again.'

    def test_validate_input_invalid_object(self):
        from CanvasLMSHelper import validate_input
        event = {}

        error = validate_input(event)
        assert error == 'There was an error processing your request. Please check the question setup and try again.'

    def test_vremove_html_tags(self):
        from CanvasLMSHelper import remove_html_tags
        str_input = '<style>stylish</style>'

        result = remove_html_tags(str_input)
        assert result == ''