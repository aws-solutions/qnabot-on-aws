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

import json
import unittest
from unittest.mock import Mock

class TestConnectCallback(unittest.TestCase):

    def test_handler(self):
        import ConnectCallback
        event = {
            'res': {
                'result': {
                    'args': [json.dumps({
                        'AWS_region': 'us-east-1',
                        'AWS_connect_instance_id': 'test-id',
                        'AWS_connect_contact_flow_id': 'test-flow-id',
                        'AWS_connect_queue_id': 'test-queue-id',
                        'AWS_connect_phone_number': 'test-phone-number'
                    })]
                },
                'session': {
                    'contact_name': {
                        'FirstName': 'John'
                    },
                    'contact_phone_number': {
                        'PhoneNumber': '+1-234 56 7890'
                    }
                }
            }
        }

        connect_mock = Mock()

        boto3_mock = Mock()
        boto3_mock.client.return_value = connect_mock
        ConnectCallback.boto3 = boto3_mock

        response = ConnectCallback.handler(event, None)
        self.assertEqual(connect_mock.start_outbound_voice_contact.call_count, 1)
        connect_mock.start_outbound_voice_contact.assert_called_with(
            DestinationPhoneNumber='+1+1-234 56 7890',
            ContactFlowId='test-flow-id',
            InstanceId='test-id',
            QueueId='test-queue-id',
            SourcePhoneNumber='test-phone-number',
            Attributes={
                'callerName': 'John'
            }
        )
        self.assertEqual(response, {'res': {'result': {'args': ['{"AWS_region": "us-east-1", "AWS_connect_instance_id": "test-id", "AWS_connect_contact_flow_id": "test-flow-id", "AWS_connect_queue_id": "test-queue-id", "AWS_connect_phone_number": "test-phone-number"}']}, 'session': {'contact_name': {'FirstName': 'John'}, 'contact_phone_number': {'PhoneNumber': '+1-234 56 7890'}}}})

    def test_handler_with_missing_arguments(self):
        import ConnectCallback
        event = {
            'res': {
                'result': {
                    'args': ''
                },
            }
        }

        response = ConnectCallback.handler(event, None)
        self.assertEqual(response, {'res': {'result': {'args': ''}, 'message': 'Your Lambda hook function in the QnA Bot designer is missing Lambda Hook Arguments. Include the values for the following parameters and values in a JSON string: AWS Region, AWS Connect Instance ID, AWS Connect Contact Flow ID, AWS Connect Queue ID, and AWS Connect Phone Number.'}})

    def test_handler_handles_connect_errors(self):
        import ConnectCallback
        event = {
            'res': {
                'result': {
                    'args': [json.dumps({
                        'AWS_region': 'us-east-1',
                        'AWS_connect_instance_id': 'test-id',
                        'AWS_connect_contact_flow_id': 'test-flow-id',
                        'AWS_connect_queue_id': 'test-queue-id',
                        'AWS_connect_phone_number': 'test-phone-number'
                    })]
                },
                'session': {
                    'contact_name': {
                        'FirstName': 'John'
                    },
                    'contact_phone_number': {
                        'PhoneNumber': '+1-234 56 7890'
                    }
                }
            }
        }

        connect_mock = Mock()
        connect_mock.start_outbound_voice_contact.side_effect = Exception('test error')

        boto3_mock = Mock()
        boto3_mock.client.return_value = connect_mock
        ConnectCallback.boto3 = boto3_mock

        response = ConnectCallback.handler(event, None)
        print(response)
        self.assertEqual(response, {'res': {'result': {'args': ['{"AWS_region": "us-east-1", "AWS_connect_instance_id": "test-id", "AWS_connect_contact_flow_id": "test-flow-id", "AWS_connect_queue_id": "test-queue-id", "AWS_connect_phone_number": "test-phone-number"}']}, 'session': {'contact_name': {'FirstName': 'John'}, 'contact_phone_number': {'PhoneNumber': '+1-234 56 7890'}}, 'message': 'Hmmm. I had a problem calling you. Sorry about that.'}})