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

class TestFeedback(unittest.TestCase):

    def test_handler_positive_feedback(self):
        import Feedback

        client_mock = Mock()
        client_mock.put_record.return_value = 'Put Record Success'
        client_mock.publish.return_value = 'Publish Success'
        client_mock.submit_feedback.return_value = 'Feedback Submit Success'

        boto3_mock = Mock()
        boto3_mock.client.return_value = client_mock
        Feedback.boto3 = boto3_mock

        event = {
             'req': {
                 '_userInfo': 'user-info',
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'responsible-qid',
                                 'q': 'test-question'
                            },
                            'kendra': {
                                'kendraIndexId': 'index-id',
                                'kendraQueryId': 'query-id',
                                'kendraResultId': 'result-id',
                                'kendraResponsibleQid': 'responsible-qid'
                            }
                       }
                  }
             },
             'res': {
                'result': {
                    'args': ['correct']
                }
            }
        }

        response = Feedback.handler(event, None)
        firehose_call_args = client_mock.put_record.call_args.kwargs
        firehose_call_data = json.loads(firehose_call_args['Record']['Data'])
        client_mock.put_record.assert_called()
        self.assertEqual(firehose_call_args['DeliveryStreamName'], 'firehose')
        self.assertEqual(firehose_call_data['qid'], 'responsible-qid')
        self.assertEqual(firehose_call_data['utterance'], 'test-question')
        self.assertEqual(firehose_call_data['feedback'], 'correct')
        self.assertEqual(firehose_call_data['userInfo'], 'user-info')

        sns_call_args = client_mock.publish.call_args.kwargs
        print(sns_call_args)
        sns_call_message = json.loads(sns_call_args['Message'])['default']
        client_mock.publish.assert_called()
        self.assertEqual(sns_call_args['TargetArn'], 'arn:sns:topic')
        self.assertEqual(sns_call_args['MessageStructure'], 'json')
        self.assertEqual(sns_call_args['Subject'], 'QnABot - Feedback received')
        self.assertIn('Positive feedback (Thumbs Up) received on QnABot answer:', sns_call_message)
        self.assertIn('Question ID: responsible-qid', sns_call_message)
        self.assertIn('Question: test-question', sns_call_message)

        client_mock.submit_feedback.assert_called_once_with(IndexId='index-id', QueryId='query-id', RelevanceFeedbackItems=[{'ResultId': 'result-id', 'RelevanceValue': 'RELEVANT'}])

        self.assertEqual(response, {"req": {"_userInfo": "user-info", "session": {"qnabotcontext": {"previous": {"qid": "responsible-qid", "q": "test-question"}, "kendra": {"kendraIndexId": "index-id", "kendraQueryId": "query-id", "kendraResultId": "result-id", "kendraResponsibleQid": "responsible-qid"}}}}, "res": {"result": {"args": ["correct"]}}})

    def test_handler_negative_feedback(self):
        import Feedback

        client_mock = Mock()
        client_mock.put_record.return_value = 'Put Record Success'
        client_mock.publish.return_value = 'Publish Success'
        client_mock.submit_feedback.return_value = 'Feedback Submit Success'

        boto3_mock = Mock()
        boto3_mock.client.return_value = client_mock
        Feedback.boto3 = boto3_mock

        event = {
             'req': {
                 '_userInfo': {
                     'GivenName': 'John',
                     'FamilyName': 'Deere',
                     'Email': 'XXXXXXXXXXXXXXXXXXXXX'
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'responsible-qid',
                                 'q': 'test-question'
                            },
                            'kendra': {
                                'kendraIndexId': 'index-id',
                                'kendraQueryId': 'query-id',
                                'kendraResultId': 'result-id',
                                'kendraResponsibleQid': 'responsible-qid'
                            }
                       }
                  }
             },
             'res': {
                'result': {
                    'args': ['incorrect']
                }
            }
        }

        response = Feedback.handler(event, None)
        firehose_call_args = client_mock.put_record.call_args.kwargs
        firehose_call_data = json.loads(firehose_call_args['Record']['Data'])
        client_mock.put_record.assert_called()
        self.assertEqual(firehose_call_args['DeliveryStreamName'], 'firehose')
        self.assertEqual(firehose_call_data['qid'], 'responsible-qid')
        self.assertEqual(firehose_call_data['utterance'], 'test-question')
        self.assertEqual(firehose_call_data['feedback'], 'incorrect')
        self.assertEqual(firehose_call_data['userInfo'], {'GivenName': 'John', 'FamilyName': 'Deere', 'Email': 'XXXXXXXXXXXXXXXXXXXXX'})

        sns_call_args = client_mock.publish.call_args.kwargs
        sns_call_message = json.loads(sns_call_args['Message'])['default']
        client_mock.publish.assert_called()
        self.assertEqual(sns_call_args['TargetArn'], 'arn:sns:topic')
        self.assertEqual(sns_call_args['MessageStructure'], 'json')
        self.assertEqual(sns_call_args['Subject'], 'QnABot - Feedback received')
        self.assertIn('Negative feedback (Thumbs Down) received on QnABot answer:', sns_call_message)
        self.assertIn('Question ID: responsible-qid', sns_call_message)
        self.assertIn('Question: test-question', sns_call_message)
        self.assertIn('User: John Deere <XXXXXXXXXXXXXXXXXXXXX>', sns_call_message)


        client_mock.submit_feedback.assert_called_once_with(IndexId='index-id', QueryId='query-id', RelevanceFeedbackItems=[{'ResultId': 'result-id', 'RelevanceValue': 'NOT_RELEVANT'}])
        self.assertEqual(response, {"req": {"_userInfo": {"GivenName": "John", "FamilyName": "Deere", "Email": "XXXXXXXXXXXXXXXXXXXXX"}, "session": {"qnabotcontext": {"previous": {"qid": "responsible-qid", "q": "test-question"}, "kendra": {"kendraIndexId": "index-id", "kendraQueryId": "query-id", "kendraResultId": "result-id", "kendraResponsibleQid": "responsible-qid"}}}}, "res": {"result": {"args": ["incorrect"]}}})

    def test_handler_handles_error(self):
        import Feedback

        client_mock = Mock()
        client_mock.put_record.side_effect = Exception('Put Record Error')

        boto3_mock = Mock()
        boto3_mock.client.return_value = client_mock
        Feedback.boto3 = boto3_mock

        event = {
             'req': {
                 '_userInfo': {
                     'GivenName': 'John',
                     'FamilyName': 'Deere',
                     'Email': 'XXXXXXXXXXXXXXXXXXXXX'
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'responsible-qid',
                                 'q': 'test-question'
                            }
                       }
                  }
             },
             'res': {
                'result': {
                    'args': ['incorrect']
                }
            }
        }

        response = Feedback.handler(event, None)
        client_mock.put_record.assert_called()
        self.assertEqual(response, {"req": {"_userInfo": {"GivenName": "John", "FamilyName": "Deere", "Email": "XXXXXXXXXXXXXXXXXXXXX"}, "session": {"qnabotcontext": {"previous": {"qid": "responsible-qid", "q": "test-question"}}}}, "res": {"result": {"args": ["incorrect"]}}})
