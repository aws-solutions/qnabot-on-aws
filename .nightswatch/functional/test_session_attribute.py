######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import pytest
import json
import time

from helpers.cloud_watch_client import CloudWatchClient
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator
from helpers.website_model.chat_page import ChatPage

QUESTION_FILEPATH = './question_bank/session_attribute_questions.json'
QIDS = ['Session.001','Session.002','Session.003','Session.004']

class TestSessionAttribute():
    # https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/setting-amazon-lex-session-attributes.html

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

    def test_setup(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator):
        """
        Creates test questions and asserts they all exist before continuing.
        """
        menu = MenuNav(dom_operator)

        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        # Needs to be enabled, otherwise all questions fallback
        assert 'Success' in settings_page.enable_kendra_fallback()
        assert 'Success' in settings_page.disable_embeddings()
        assert 'Success' in settings_page.disable_llm()

        edit_page = menu.open_edit_page()

        for qid in QIDS:
            question = self.__get_question_by_qid(qid, loaded_questions)
            self.__create_question(question, edit_page)
        edit_page.refresh_questions()
        
        for qid in QIDS:
            assert edit_page.check_question_exists_by_qid(qid)

    def test_default_returned_when_attribute_not_set(self, client_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Tests that the default value is returned when the attribute is not set.
        """
        qid = 'Session.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        chat_page = ChatPage(dom_operator)

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        assert 'default' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_set_session_attributes_using_ui(self, client_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Tests that the session attribute is set and can be created using the question designer.
        """
        qids = ['Session.002', 'Session.004']

        questions = [self.__get_question_by_qid(qid, loaded_questions) for qid in qids]

        chat_page = ChatPage(dom_operator)

        chat_page.send_message(questions[0]['q'][0])
        chat_page.send_message(questions[1]['q'][0])
        answer = chat_page.get_messages()
        assert 'Here is your session attribute: "Amazon"' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_set_session_attributes_using_handlebars(self, client_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Tests the session attribute can be set using handlebars.
        """
        qids = ['Session.003', 'Session.004']

        questions = [self.__get_question_by_qid(qid, loaded_questions) for qid in qids]

        chat_page = ChatPage(dom_operator)

        chat_page.send_message(questions[0]['q'][0])
        chat_page.send_message(questions[1]['q'][0])
        answer = chat_page.get_messages()
        assert 'Here is your session attribute: "AWS"' in answer
        cw_client.print_fulfillment_lambda_logs()
