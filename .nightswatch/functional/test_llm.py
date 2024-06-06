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

import pytest
import os
import json

from helpers.cloud_watch_client import CloudWatchClient
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator
from helpers.website_model.chat_page import ChatPage

QUESTION_FILEPATH = './question_bank/llm_questions.json'

region = os.environ.get('CURRENT_STACK_REGION')
g5_instance_regions = ['ca-central-1', 'eu-west-1']
g5_instance_unsupported_region_reason = 'Region Not Supported'
llm_multilanguage_unsupported_reason = 'Non-English not supported via SageMaker'

@pytest.mark.skipif(region in g5_instance_regions, reason=g5_instance_unsupported_region_reason)
@pytest.mark.skipif_llm_not_enabled()
class TestLlm:

    @pytest.fixture(scope='class')
    def loaded_questions(self) -> list[dict]:
        question_file = open(QUESTION_FILEPATH, encoding='utf-8-sig')
        data = json.load(question_file)
        question_file.close()
        return data['qna']

    def __create_question(self, question: dict, edit_page):
        qid = question['qid']
        if edit_page.check_question_exists_by_qid(qid):
            edit_page.delete_question_by_qid(qid)
        edit_page.add_question(**question)

    def __get_question_by_qid(self, qid, loaded_questions: list[dict]) -> dict:
        return [q for q in loaded_questions if q['qid'] == qid][0]

    def test_setup(self, designer_login, dom_operator: DomOperator, loaded_questions: list[dict]):
        """
        Overrides deployment settings and adds questions before running other tests.
        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.enable_llm()
        assert 'Success' in settings_page.enable_embeddings()
        assert 'Success' in settings_page.enable_multi_language_support()

        import_page = menu.open_import_page()
        import_page.import_language()

        qid = 'LLM.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

    def test_disambiguation(self, client_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test question disambiguation.
        """

        chat_page = ChatPage(dom_operator)

        chat_page.send_message('Who was Humpty Dumpty?')
        chat_page.send_message('Where did he sit?')
        answer = chat_page.get_last_message_text()
        assert 'LLM generated query' in answer
        assert 'Humpty Dumpty' in answer
        assert 'wall' in answer
        cw_client.print_fulfillment_lambda_logs()

    @pytest.mark.skipif_version_less_than('5.5.0')
    def test_ignore_utterances(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test that phrases in the ignored utterances list are not disambiguated when LLM_GENERATE_QUERY_ENABLE is set to true.

        """
        menu = MenuNav(dom_operator)
        chat_page = menu.open_chat_page()

        chat_page.send_message('Who was Humpty Dumpty?')
        chat_page.send_message('Where did he sit?')
        chat_page.send_message('help me')
        answer = chat_page.get_last_message_text()
        assert 'I am the QnA bot, ask me a question and I will try my best to answer it.' in answer
        assert 'LLM generated query' not in answer

        chat_page.send_positive_feedback()
        answer = chat_page.get_last_message_text()
        assert 'Thank you for your positive feedback on this answer, your feedback helps us continuously improve.' in answer
        assert 'LLM generated query' not in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_inference(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test LLM model can infer answers from information.
        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()
        # This is needed since the LLM changes the question to an unrelated query
        assert 'Success' in settings_page.disable_llm_disambiguation()

        chat_page = menu.open_chat_page()

        chat_page.send_message('Who was Humpty Dumpty?')

        chat_page.send_message('Did Humpty Dumpty sit on wall?')
        answer = chat_page.get_last_message_text()
        assert 'Yes' in answer or 'on the wall' in answer or 'on a wall' in answer

        cw_client.print_fulfillment_lambda_logs()

    @pytest.mark.skipif(region in g5_instance_regions, reason=llm_multilanguage_unsupported_reason)
    def test_translation(self, client_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test LLM answers are translated into the preferred language.
        """

        chat_page = ChatPage(dom_operator)

        chat_page.send_message('Où était assis Humpty Dumpty?')
        answer = chat_page.get_last_message_text()
        assert 'mur' in answer
        cw_client.print_fulfillment_lambda_logs()
