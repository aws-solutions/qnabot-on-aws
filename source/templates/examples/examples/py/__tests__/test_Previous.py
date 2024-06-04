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

class TestPrevious(unittest.TestCase):

    def test_handler(self):
        import Previous

        subscribable_object = Mock()
        subscribable_object.read.return_value = json.dumps({'qid': 'next'})
        lambda_client_mock = Mock()
        lambda_client_mock.invoke.return_value = {'Payload': subscribable_object}

        boto3_mock = Mock()
        boto3_mock.client.return_value = lambda_client_mock
        Previous.boto3 = boto3_mock

        event = {
             'req': {
                 '_info': {
                     'es': {
                         'service': {
                             'qid': 'TEST.001'
                         }
                     }
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'TEST.002',
                                 'q': 'test question'
                            },
                            'navigation': {
                                'q': 'test nav question',
                                 'next': 'next',
                                 'previous': 'previous',
                                 'hasParent': 'Mr and Mrs Question'
                            }
                       }
                  }
             },
             'res': {
                 'session': {
                     'qnabotcontext': {}
                }
            }
        }

        response = Previous.handler(event, None)
        assert response == {'req': {'_info': {'es': {'service': {'qid': 'TEST.001'}}}, 'session': {'qnabotcontext': {'previous': {'qid': 'TEST.002', 'q': 'test question'}, 'navigation': {'q': 'test nav question', 'next': 'next', 'previous': 'previous', 'hasParent': 'Mr and Mrs Question'}}}}, 'res': {'session': {'qnabotcontext': {'previous': {'qid': 'previous', 'q': 'test nav question'}, 'navigation': {'next': 'next', 'previous': [], 'hasParent': 'Mr and Mrs Question'}}}}}

    def test_handler_with_lambda_invoke(self):
        import Previous

        subscribable_object = Mock()
        subscribable_object.read.return_value = json.dumps({
            'qid': 'next',
            'a': 'answer',
            'l': 'QNA:test',
            'args': ['arg1', 'arg2'],
            'res': {
                'session': {
                    'qnabotcontext': {
                        'previous': ''
                    }
                }
            },
            'next': 'next'
        })

        boto_client_mock = Mock()
        boto_client_mock.invoke.return_value = {'Payload': subscribable_object}
        boto_client_mock.describe_stacks.return_value = {
            'Stacks': [{
                'Outputs': [{
                    'OutputKey': 'test',
                    'OutputValue': 'test'
                }]
            }]
        }

        boto3_mock = Mock()
        boto3_mock.client.return_value = boto_client_mock
        Previous.boto3 = boto3_mock

        event = {
             'req': {
                'question': 'test question',
                 '_info': {
                     'es': {
                         'service': {
                             'qid': 'TEST.001'
                         }
                     }
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'TEST.002',
                                 'q': 'test question'
                            },
                            'navigation': {
                                 'next': ['next', 'last'],
                                 'previous': ['previous1', 'previous2'],
                                 'hasParent': 'Mr and Mrs Question'
                            }
                       }
                  }
             },
             'res': {
                 'session': {
                    'qnabotcontext': {},
                    'appContext': {}
                }
            }
        }

        response = Previous.handler(event, None)
        assert response == {"qid": "next", "a": "answer", "l": "QNA:test", "args": ["arg1", "arg2"], "res": {"session": {"qnabotcontext": {"previous": {"qid": "next", "a": "answer", "alt": {}, "q": "test question"}, "navigation": {"next": "next", "previous": [], "hasParent": "Mr and Mrs Question"}}}}, "next": "next"}

    def test_handler_with_lambda_invoke_answer(self):
        import Previous

        subscribable_object = Mock()
        subscribable_object.read.return_value = json.dumps({
            'qid': 'next',
            'a': 'answer',
            'next': 'next'
        })

        boto_client_mock = Mock()
        boto_client_mock.invoke.return_value = {'Payload': subscribable_object}
        boto_client_mock.describe_stacks.return_value = {
            'Stacks': [{
                'Outputs': [{
                    'OutputKey': 'test',
                    'OutputValue': 'test'
                }]
            }]
        }

        boto3_mock = Mock()
        boto3_mock.client.return_value = boto_client_mock
        Previous.boto3 = boto3_mock

        event = {
             'req': {
                'question': 'test question',
                 '_info': {
                     'es': {
                         'service': {
                             'qid': 'TEST.001'
                         }
                     }
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'TEST.002',
                                 'q': 'test question'
                            },
                            'navigation': {
                                 'next': ['next', 'last'],
                                 'previous': ['previous1', 'previous2'],
                                 'hasParent': 'Mr and Mrs Question'
                            }
                       }
                  }
             },
             'res': {
                 'session': {
                    'qnabotcontext': {},
                    'appContext': {}
                }
            }
        }

        response = Previous.handler(event, None)
        assert response == {"req": {"question": "test question", "_info": {"es": {"service": {"qid": "TEST.001"}}}, "session": {"qnabotcontext": {"previous": {"qid": "TEST.002", "q": "test question"}, "navigation": {"next": ["next", "last"], "previous": ["previous1"], "hasParent": "Mr and Mrs Question"}}}}, "res": {"session": {"qnabotcontext": {"previous": {"qid": "next", "q": "test question"}, "navigation": {"next": "next", "previous": ["previous1"], "hasParent": "Mr and Mrs Question"}}, "appContext": {"altMessages": {}}}, "result": {"qid": "next", "a": "answer", "next": "next"}, "type": "PlainText", "message": "answer", "plainMessage": "answer"}}

    def test_handler_handles_request_with_no_previous(self):
        import Previous

        subscribable_object = Mock()
        subscribable_object.read.return_value = json.dumps({'qid': 'next'})
        lambda_client_mock = Mock()
        lambda_client_mock.invoke.return_value = {'Payload': subscribable_object}

        boto3_mock = Mock()
        boto3_mock.client.return_value = lambda_client_mock
        Previous.boto3 = boto3_mock

        event = {
             'req': {
                 '_info': {
                     'es': {
                         'service': {
                             'qid': 'TEST.001'
                         }
                     }
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'TEST.002',
                                 'q': 'test question'
                            },
                       }
                  }
             },
             'res': {
                 'session': {
                     'qnabotcontext': {}
                }
            }
        }

        response = Previous.handler(event, None)
        assert response == {"req": {"_info": {"es": {"service": {"qid": "TEST.001"}}}, "session": {"qnabotcontext": {"previous": {"qid": "TEST.002", "q": "test question"}}}}, "res": {"session": {"qnabotcontext": {}}}}

    def test_build_card_from_response(self):
        import Previous

        event = {
            'res': {
                'card': {}
            }
       }

        response = {
            'r': {
                'title': 'test-title',
                'subTitle': 'test-subtitle',
                'imageUrl': 'test-image',
                'buttons': [{
                    'text': 'test-button-text',
                    'url': 'test-button-url'
                }]
            }
        }

        new_event = Previous.build_card_from_response(event, response)
        assert new_event == {'res': {'card': {'send': True, 'title': 'test-title', 'text': '', 'subTitle': 'test-subtitle', 'imageUrl': 'test-image', 'buttons': [{'text': 'test-button-text', 'url': 'test-button-url'}]}}}

    def test_update_result(self):
        import Previous

        event = {
             'req': {
                'question': 'test question',
                 '_info': {
                     'es': {
                         'service': {
                             'qid': 'TEST.001'
                         }
                     }
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'TEST.003',
                                 'q': 'test question'
                            },
                            'navigation': {
                                 'next': ['next', 'last'],
                                 'previous': ['previous'],
                                 'hasParent': False
                            }
                       }
                  }
             },
            'res': {
                'session': {
                    'qnabotcontext': {},
                    'appContext': {}
                },
                'card': {}
            }
       }
        
        response = {
            'qid': 'TEST.003',
            'alt': {
                'ssml': 'test'
            },
            'next': 'next',
            'a': 'test-answer',
            't': 'test-topic',
            'r': {
                'title': 'test-title',
                'subTitle': 'test-subtitle',
                'imageUrl': 'test-image',
                'buttons': [{
                    'text': 'test-button-text',
                    'url': 'test-button-url'
                }]
            }
        }

        new_event = Previous.update_result(event, response)
        assert new_event == {'req': {'question': 'test question', '_info': {'es': {'service': {'qid': 'TEST.001'}}}, 'session': {'qnabotcontext': {'previous': {'qid': 'TEST.003', 'q': 'test question'}, 'navigation': {'next': ['next', 'last'], 'previous': [], 'hasParent': False}}}}, 'res': {'session': {'qnabotcontext': {'previous': {'qid': 'TEST.003', 'q': 'test question'}, 'navigation': {'next': 'next', 'previous': [], 'hasParent': False}}, 'appContext': {'altMessages': {'ssml': 'test'}}, 'topic': 'test-topic'}, 'card': {'send': True, 'title': 'test-title', 'text': '', 'subTitle': 'test-subtitle', 'imageUrl': 'test-image', 'buttons': [{'text': 'test-button-text', 'url': 'test-button-url'}]}, 'result': {'qid': 'TEST.003', 'alt': {'ssml': 'test'}, 'next': 'next', 'a': 'test-answer', 't': 'test-topic', 'r': {'title': 'test-title', 'subTitle': 'test-subtitle', 'imageUrl': 'test-image', 'buttons': [{'text': 'test-button-text', 'url': 'test-button-url'}]}}, 'type': 'SSML', 'message': 'test', 'plainMessage': 'test-answer'}}

    def test_update_lambda_hook_with_not_matching_previous(self):
        import Previous

        event = {
             'req': {
                'question': 'test question',
                 '_info': {
                     'es': {
                         'service': {
                             'qid': 'TEST.001'
                         }
                     }
                 },
                  'session': {
                       'qnabotcontext': {
                            'previous': {
                                 'qid': 'TEST.003',
                                 'q': 'test question'
                            },
                            'navigation': {
                                 'next': ['next', 'last'],
                                 'previous': ['TEST.002'],
                                 'hasParent': False
                            }
                       }
                  }
             },
             'res': {
                 'session': {
                    'qnabotcontext': {},
                    'appContext': {}
                }
            }
        }

        hook_event = {
             'res': {}
        }

        response = {
            'qid': 'TEST.001',
            'next': 'TEST.002',
            'a': 'test-answer'
        }

        new_hook_event = Previous.update_lambda_hook(event, hook_event, response)
        assert new_hook_event == {'res': {'session': {'qnabotcontext': {'previous': {'qid': 'TEST.001', 'a': 'test-answer', 'alt': {}, 'q': 'test question'}, 'navigation': {'next': 'TEST.002', 'previous': [], 'hasParent': False}}}}}