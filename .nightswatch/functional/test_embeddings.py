######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import pytest
import time
import json

from helpers.cloud_watch_client import CloudWatchClient
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator

QUESTION_FILEPATH = './question_bank/embeddings_questions.json'

# https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/semantic-question-matching.html
@pytest.mark.skipif_embeddings_not_enabled()
class TestEmbeddings:

    @pytest.fixture(scope='class')
    def loaded_questions(self) -> list[dict]:
        question_file = open(QUESTION_FILEPATH)
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

    def test_setup(self, designer_login, dom_operator: DomOperator):
        """
        Overrides deployment settings before running other tests.
        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.disable_llm()
        assert 'Success' in settings_page.disable_filter()
        assert 'Success' in settings_page.enable_embeddings()

    def test_semantic_matching(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test that the bot can answer questions based on semantic matching.
        """
        qid = 'Embed.001'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message('Where does the president live?')
        answer = chat_page.get_messages()
        assert question['a'] in answer
        cw_client.print_fulfillment_lambda_logs()

