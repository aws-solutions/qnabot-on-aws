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

import unittest
from unittest.mock import patch, Mock
import pytest
from CanvasLMSHook import handler

@patch('CanvasLMSHook.Canvas')
@patch('CanvasLMSHook.CanvasLMS')
class TestCanvasLMSHook(unittest.TestCase):

    def test_sets_message_with_error_if_query_is_not_valid(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "test"
        }

        event = handler(event, context)
        canvas_lms_mock.set_alt_message.assert_called_once_with({'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}}, 'There was an error processing your request. For a list of available options, type or say <i>canvas menu</i>.')

    def test_sets_message_with_error_if_value_error_is_thrown(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }

        canvas_lms_mock.json.loads.side_effect = ValueError()

        event = handler(event, context)
        canvas_lms_mock.set_alt_message.assert_called_once_with({'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}}, 'There was an error processing your request. Please contact your administrator.')

    def test_sets_message_with_error_if_invalid_input(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = True

        event = handler(event, context)
        canvas_lms_mock.set_alt_message.assert_called_once_with({'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}}, True)

    def test_sets_message_with_error_when_course_name_slot_is_not_empty(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_event': {
                    'interpretations': [
                        {
                            'intent': {
                                'slots': {
                                    'CanvasLMS_course_name_slot': {
                                        'value': {
                                            'originalValue': 'not_empty'
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }

        canvas_lms_mock.json.loads.side_effect = ValueError()

        event = handler(event, context)
        canvas_lms_mock.set_alt_message.assert_called_once_with({'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_event': {'interpretations': [{'intent': {'slots': {'CanvasLMS_course_name_slot': {'value': {'originalValue': 'not_empty'}}}}}]}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}}, 'Sorry, was unable to find the course you are looking for. Check the course name and try again. You can also ask <i>what courses have i enrolled in</i>, to get a list of enrolled courses.')

    def test_CanvasMenu_called(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "CanvasMenu"
        }

        event = handler(event, context)
        canvas_lms_mock.query_menu.assert_called_once_with({'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}}, 'User McStudent')

    def test_CourseEnrollments_called(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "CourseEnrollments"
        }

        event = handler(event, context)
        args = canvas_lms_mock.query_enrollments_for_student.call_args.args
        canvas_lms_mock.query_enrollments_for_student.assert_called()
        self.assertEqual(args[0], {'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}})
        self.assertIsInstance(args[1], Mock)
        self.assertEqual(args[2], 'user')

    def test_CourseAssignments_called(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "CourseAssignments"
        }

        event = handler(event, context)
        args = canvas_lms_mock.query_course_assignments_for_student.call_args.args
        canvas_lms_mock.query_course_assignments_for_student.assert_called()
        self.assertEqual(args[0], {'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}})
        self.assertIsInstance(args[1], Mock)
        self.assertEqual(args[2], 'user')
        self.assertEqual(args[3], '')

    def test_SyllabusForCourse_called(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "SyllabusForCourse"
        }

        event = handler(event, context)
        args = canvas_lms_mock.query_syllabus_for_student.call_args.args
        canvas_lms_mock.query_syllabus_for_student.assert_called()
        self.assertEqual(args[0], {'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}})
        self.assertIsInstance(args[1], Mock)
        self.assertEqual(args[2], 'user')
        self.assertEqual(args[3], '')

    def test_CoursesForStudent_called(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "CoursesForStudent"
        }

        event = handler(event, context)
        args = canvas_lms_mock.query_courses_for_student.call_args.args
        canvas_lms_mock.query_courses_for_student.assert_called()
        self.assertEqual(args[0], {'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}})
        self.assertIsInstance(args[1], Mock)
        self.assertEqual(args[2], 'user')
        self.assertEqual(args[3], '')

    def test_AnnouncementsForStudent_called(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "AnnouncementsForStudent"
        }

        event = handler(event, context)
        args = canvas_lms_mock.query_announcements_for_student.call_args.args
        canvas_lms_mock.query_announcements_for_student.assert_called()
        self.assertEqual(args[0], {'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}})
        self.assertIsInstance(args[1], Mock)
        self.assertEqual(args[2], 'user')

    def test_GradesForStudent_called(self, canvas_lms_mock, canvas_mock):
        event = {
            'res': {
                'result': {
                    'args': [
                        {
                            'query': 'test'
                        }
                    ]
                }
            },
            'req': {
                '_settings': {
                    'CanvasLMS_DomainName': 'test.com',
                    'CanvasLMS_APIKey': 'test'
                },
                '_userInfo': {
                    'UserName': 'user',
                    'GivenName': 'User McStudent'
                },
                'slots': {}
            },
        }

        context = {}

        canvas_lms_mock.validate_input.return_value = False
        canvas_lms_mock.get_secret.return_value = {
            "CanvasLMS_APIKey": "test",
            "CanvasLMS_DomainName": "test.com"
        }
        canvas_lms_mock.json.loads.return_value = {
            "Query": "GradesForStudent"
        }

        event = handler(event, context)
        args = canvas_lms_mock.query_grades_for_student.call_args.args
        canvas_lms_mock.query_grades_for_student.assert_called()
        self.assertEqual(args[0], {'res': {'result': {'args': [{'query': 'test'}]}}, 'req': {'_settings': {'CanvasLMS_DomainName': 'test.com', 'CanvasLMS_APIKey': 'test'}, '_userInfo': {'UserName': 'user', 'GivenName': 'User McStudent'}, 'slots': {}}})
        self.assertIsInstance(args[1], Mock)
        self.assertEqual(args[2], 'user')
        self.assertEqual(args[3], '')
