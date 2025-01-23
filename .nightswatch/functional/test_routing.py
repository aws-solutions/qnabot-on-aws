######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import pytest
import json
import os

from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator
from helpers.website_model.chat_page import ChatPage
from helpers.lex_client import LexClient
from helpers.iam_client import IamClient
from helpers.cloud_watch_client import CloudWatchClient

QUESTION_FILEPATH = './question_bank/routing_questions.json'
QIDS = ['Routing.001', 'Routing.002', 'Routing.003']
TEST_BOT_INTENT_FILES = ['./helpers/bot_intents/greetings.json','./helpers/bot_intents/get_attribute.json', './helpers/bot_intents/set_attribute.json']
TEST_BOT_NAME = 'test_bot_routing'

region = os.environ.get('CURRENT_STACK_REGION')
lexv2_regions = [
    'us-east-1',
    'us-west-2',
    'ap-northeast-2',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ca-central-1',
    'eu-central-1',
    'eu-west-1',
    'eu-west-2'
]
unsupported_region_reason = 'Region Not Supported'

@pytest.mark.skipif(region not in lexv2_regions, reason=unsupported_region_reason)
class TestRouting:
    # https://catalog.us-east-1.prod.workshops.aws/workshops/20c56f9e-9c0a-4174-a661-9f40d9f063ac/en-US/qna/bot-routing
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

    def test_create_test_bot(self, lex_client: LexClient, iam_client: IamClient):
        """
        Tests creation of a Lex V2 bot using boto client. Asserts the bot exists.

        Required for next steps in test.
        """
        role_arn = iam_client.create_lexv2_role(TEST_BOT_NAME)
        lex_client.create_test_bot(TEST_BOT_NAME, role_arn, TEST_BOT_INTENT_FILES, locales=['en_US'])
        assert lex_client.check_bot_exists(TEST_BOT_NAME)

    def test_setup(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, lex_client: LexClient):
        """
        Creates test questions and asserts they all exist before continuing.
        """
        bot_id = lex_client.find_bot_id_from_bot_name(bot_name=TEST_BOT_NAME)

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

            if 'botRouting' in question:
                if 'specialty_bot' in question['botRouting']:
                    question['botRouting']['specialty_bot'] = f'lexv2::{bot_id}/TSTALIASID/en_US'
                    
            self.__create_question(question, edit_page)

        edit_page.refresh_questions()

        for qid in QIDS:
            assert edit_page.check_question_exists_by_qid(qid)


    def test_bot_routing(self, client_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Tests the bot routes to the specialty bot and exits the specialty bot.
        """
        qid = 'Routing.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        chat_page = ChatPage(dom_operator)

        chat_page.send_message(question['q'][0])
        chat_page.send_message('Hi')
        answer = chat_page.get_messages()
        assert question['a'] in answer
        assert 'GREETINGS, I AM TEST BOT. Welcome back to QnABot.' in answer
        cw_client.print_fulfillment_lambda_logs()
    
    def test_bot_routing_exit_utterance(self, client_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Tests the bot routes to the specialty bot but exits after one of the exit message is set by BOT_ROUTER_EXIT_MSGS.
        """
        qid = 'Routing.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        chat_page = ChatPage(dom_operator)

        chat_page.send_message(question['q'][0])
        chat_page.send_message('exit')
        answer = chat_page.get_messages()
        assert question['a'] in answer
        assert 'Welcome back to QnABot.' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_pass_attribute_to_specialty_bot(self, client_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Tests the specialty bot has access to the session attributes.
        """
        qid = 'Routing.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        chat_page = ChatPage(dom_operator)

        chat_page.send_message(question['q'][0])
        chat_page.send_message('Do I have an attribute?')
        answer = chat_page.get_messages()
        assert 'TRUE - YOUR ATTRIBUTE IS CONFIGURED CORRECTLY. Welcome back to QnABot.' in answer
        cw_client.print_fulfillment_lambda_logs()

    @pytest.mark.skipif_version_less_than('5.5.0')
    def test_attribute_received_from_specialty_bot_and_chaining(self, client_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Receives a session attribute from the specialty bot, exits the specialty bot, and executes document chaining using the session attribute.
        
        See: https://github.com/aws-solutions/qnabot-on-aws/issues/508
        """
        qid = 'Routing.002'
        question = self.__get_question_by_qid(qid, loaded_questions)

        chat_page = ChatPage(dom_operator)

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        assert 'HERE IS A SESSION ATTRIBUTE. Welcome back to QnABot. You just received a session attribute from test bot.' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_bot_cleanup(self, lex_client: LexClient, iam_client: IamClient):
        """
        Tests the bot and role is deleted correctly.
        """
        lex_client.delete_bot_if_exists(TEST_BOT_NAME)
        iam_client.delete_role_if_exists(TEST_BOT_NAME)
        assert not lex_client.check_bot_exists(TEST_BOT_NAME)