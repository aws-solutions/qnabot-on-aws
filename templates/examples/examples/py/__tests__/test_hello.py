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
import unittest
import datetime
from unittest.mock import Mock, patch

@patch('hello.datetime')
class TestHello(unittest.TestCase):
    
    def test_returns_morning_greeting(self, datetime_mock):
        from hello import handler
        event = {
            'res': {
                'message': 'test'
            },
            'req': 'test',
        }
        datetime_mock.datetime.now.return_value = datetime.datetime(2022, 1, 1, 8, 0, 0)

        handler(event, {})
        assert event['res']['message'] == 'Good morning, test'

    def test_returns_afternoon_greeting(self, datetime_mock):
        from hello import handler
        event = {
            'res': {
                'message': 'test'
            },
            'req': 'test',
        }
        datetime_mock.datetime.now.return_value = datetime.datetime(2022, 1, 1, 16, 0, 0)

        handler(event, {})
        assert event['res']['message'] == 'Good afternoon, test'
        
    
    def test_returns_evening_greeting(self, datetime_mock):
        from hello import handler
        event = {
            'res': {
                'message': 'test'
            },
            'req': 'test',
        }
        datetime_mock.datetime.now.return_value = datetime.datetime(2022, 1, 1, 22, 0, 0)

        handler(event, {})
        assert event['res']['message'] == 'Good evening, test'
        