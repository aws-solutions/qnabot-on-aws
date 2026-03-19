######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import pytest
import json
import pathlib

from helpers.website_model.dom_operator import DomOperator
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.chat_page import ChatPage
from helpers.translate_client import TranslateClient
from helpers.cloud_watch_client import CloudWatchClient

QUESTION_FILEPATH = './question_bank/translate_questions.json'

QNABOT_BLOG_QUESTION_TEXT = 'Can I backup Q and A Bot content'
QNABOT_BLOG_ANSWER_TEXT = 'Yes. Use the Content Designer to export your content as a JSON file. Maintain this file in your version control system or S3 bucket. Use the Designer UI Import feature to restore content from the JSON file.'
class TestTranslate:
    
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

    def test_setup(self, designer_login, dom_operator: DomOperator, translate_client: TranslateClient):
        """
        Sets default settings before running tests.
        """

        translate_client.delete_all_terminologies()

        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        # Needs to be enabled, otherwise all questions fallback
        assert 'Success' in settings_page.enable_kendra_fallback()
        assert 'Success' in settings_page.disable_embeddings()
        assert 'Success' in settings_page.disable_llm()
        assert 'Success' in settings_page.enable_multi_language_support()
        assert 'Success' in settings_page.enable_custom_terminology()

    def test_client_conversation_english(self, client_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Verifies the question works in English first before asking in other languages.

        Prerequisite: Blog entry example must be imported first.
        """
        chat_page = ChatPage(dom_operator)

        expected_response = QNABOT_BLOG_ANSWER_TEXT

        call = QNABOT_BLOG_QUESTION_TEXT
        chat_page.send_message(call)
        answer = chat_page.get_messages()
        assert expected_response in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_client_conversation_multi(self, client_login, dom_operator: DomOperator, translate_client: TranslateClient, languages: list[str], cw_client: CloudWatchClient):
        """
        Test the same question is translated to other locales.
        """
        chat_page = ChatPage(dom_operator)

        calls = [translate_client.translate(QNABOT_BLOG_QUESTION_TEXT, language) for language in languages]
        expected_responses = [translate_client.translate(QNABOT_BLOG_ANSWER_TEXT, language) for language in languages]

        chat_page.send_message(calls[0])
        chat_page.send_message(calls[1])
        answer = chat_page.get_messages()
        assert expected_responses[0] in answer
        assert expected_responses[1] in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_custom_terminology(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, translate_client: TranslateClient, cw_client: CloudWatchClient):
        """
        Test that custom terminology can be uploaded and does not get translated when asked in the other language.
        """
        menu = MenuNav(dom_operator)
        custom_terminology = menu.open_custom_terminology()
        terminology_file = f'{pathlib.Path().resolve()}/files/terms.csv'
        custom_terminology.upload_file(terminology_file)

        qid = 'Translate.001'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        # French language currently has an issue with custom terminology.
        call = translate_client.translate(question['q'][0], 'es')
        response = translate_client.translate(question['a'], 'es')
    
        chat_page.send_message(call)
        answer = chat_page.get_messages()
        assert translate_client.has_terminology('terms')
        assert response in answer
        cw_client.print_fulfillment_lambda_logs()

    @pytest.mark.skip(reason="Issue under review")
    def test_custom_terminology_translates_to_specified_term(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test that custom terminology can be uploaded and translates based on custom terminology provided.

        See: https://github.com/aws-solutions/qnabot-on-aws/issues/455
        """
        menu = MenuNav(dom_operator)

        custom_terminology = menu.open_custom_terminology()
        terminology_file = f'{pathlib.Path().resolve()}/files/EPCTerminology.csv'
        custom_terminology.upload_file(terminology_file)

        qid = 'Translate.003'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message('Traducción de tarifas de prueba')
        answer = chat_page.get_messages()
        assert 'sin incurrir ningún cargo' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_lang_handlebar(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test different answers are returned based on the current language using the lang handlebars.

        See: https://aws.amazon.com/blogs/machine-learning/building-a-multilingual-question-and-answer-bot-with-amazon-lex/
        """
        qid = 'Translate.002'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message('Why should you say mucho to your Hispanic friends?')
        answer = chat_page.get_messages()
        assert 'It means a lot to them' in answer

        chat_page.send_message('¿Por qué deberías decir mucho cuando hablas con tus amigos hispanos?')
        answer = chat_page.get_messages()
        assert 'Significa mucho para mí' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_lang_support(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test the language example can be imported and the client can select their language based on utterance.

        See: https://aws.amazon.com/blogs/machine-learning/building-a-multilingual-question-and-answer-bot-with-amazon-lex/
        """
        qid = 'Translate.002'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()
        import_page.import_language()

        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message('Spanish')
        chat_page.send_message('Why should you say mucho to your Hispanic friends?')
        answer = chat_page.get_messages()
        assert 'Significa mucho para mí' in answer
        cw_client.print_fulfillment_lambda_logs()
