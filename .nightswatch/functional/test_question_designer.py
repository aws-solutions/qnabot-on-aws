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
import json
import time

from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator
from helpers.lex_client import LexClient
from helpers.translate_client import TranslateClient
from helpers.cloud_watch_client import CloudWatchClient

QUESTION_FILEPATH = './question_bank/question_designer_questions.json'

class TestQuestionDesigner:

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
        # Needs to be enabled, otherwise all questions fallback
        assert 'Success' in settings_page.enable_kendra_fallback()
        assert 'Success' in settings_page.disable_embeddings()
        assert 'Success' in settings_page.disable_llm()
        assert 'Success' in settings_page.enable_multi_language_support()

    def test_create_question(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test creating a question in the question designer and available to the client.
        """
        qid = 'Designer.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        assert question['a'] in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_update_question(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test question is updated using question designer.
        """
        qid = 'Designer.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        question['a'] = 'pancakes with maple syrup'
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        assert edit_page.check_question_exists_by_qid(qid)
        edit_page.edit_question_by_qid(**question)

        chat_page = menu.open_chat_page()

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        assert question['a'] in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_delete_question(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator):
        """
        Test question is deleted using question designer.
        """
        qid = 'Designer.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        assert edit_page.check_question_exists_by_qid(qid)
        edit_page.delete_question_by_qid(qid)

        chat_page = menu.open_chat_page()

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        assert question['a'] not in answer

    def test_multiple_utterances(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator):
        """
        Test question can contain multiple utterances.
        """
        qid = 'Designer.001'
        question = self.__get_question_by_qid(qid, loaded_questions)

        uterrances = question['q'] + ['What rots your teeth?', 'What do you hand out at Halloween?']

        question['q'] = uterrances

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        for utterance in question['q']:
            chat_page.send_message(utterance)
            answer = chat_page.get_messages()
            assert question['a'] in answer

    def test_create_quiz_question(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test quiz question creation in question designer.

        See: https://catalog.us-east-1.prod.workshops.aws/workshops/20c56f9e-9c0a-4174-a661-9f40d9f063ac/en-US/qna/quiz
        """
        qids = ['Quiz.001','Quiz.002']

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for qid in qids:
            question = self.__get_question_by_qid(qid, loaded_questions)
            self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message(f'Quiz start')
        chat_page.send_message('A')
        answer = chat_page.get_messages()
        assert 'Thank you for taking the quiz!' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_lex_rebuild(self, designer_login, dom_operator: DomOperator):
        """
        Test lex rebuild.

        Required for slot questions.
        """
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()
        status = edit_page.rebuild_lex()
        assert status == 'Success!'

    def test_create_slot_question(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test create slot type question in question designer.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/configure-intent-and-slot-matching.html
        """
        qids = ['Slot.001','Slot.002','Slot.003']

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for qid in qids:
            question = self.__get_question_by_qid(qid, loaded_questions)
            self.__create_question(question, edit_page)

        edit_page.rebuild_lex()

        chat_page = menu.open_chat_page()

        reservation_responses = ['I want to book a flight', 'Jeff', '2023-07-06', 'Houston', 'Toronto', '8am', 'sure']
        cancelled_reservation_responses = ['I want to book a flight', 'Jeff', 'Today', 'Houston', 'Toronto', '8am', 'N']

        for response in reservation_responses:
            chat_page.send_message(response)
        answer = chat_page.get_messages()
        assert 'Okay, I have confirmed your reservation.' in answer

        for response in reservation_responses:
            if response == '8am':
                assert '0800' in answer
            else:
                assert response in answer

        for response in cancelled_reservation_responses:
            chat_page.send_message(response)

        answer = chat_page.get_messages()
        assert 'Okay, I have cancelled your reservation in progress.' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_slots_created_in_lex(self, designer_login, region: str, dom_operator: DomOperator, stack_name: str, cw_client: CloudWatchClient):
        """
        Test slot type created in lex.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/configure-intent-and-slot-matching.html
        """
        qids = ['Slot.001','Slot.002','Slot.003']

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for qid in qids:
            assert edit_page.check_question_exists_by_qid(qid)

        bot_name = stack_name + '_QnaBot'
        bot_locales = ['en_US', 'es_US', 'fr_CA']
        slot_names = ['QID-SLOTTYPE-Slot_dot_002', 'QID-SLOTTYPE-Slot_dot_003']

        lex_client = LexClient(region)
        assert lex_client.bot_slot_type_names_exist_for_all_locales(bot_name, slot_names, bot_locales) is True
        cw_client.print_fulfillment_lambda_logs()

    def test_slots_are_translated(self, designer_login, dom_operator: DomOperator, translate_client: TranslateClient, cw_client: CloudWatchClient):
        """
        Test slots are translated in lex into multiple locales

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/configure-intent-and-slot-matching.html
        """
        qids = ['Slot.001','Slot.002','Slot.003']

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for qid in qids:
            assert edit_page.check_question_exists_by_qid(qid)

        english_confirmation_msg = '**Name**: Jeff - **Departing City:** Houston - **Destination**: Toronto'

        chat_page = menu.open_chat_page()
        chat_page.select_locale('fr_CA')

        french_responses = ['Je souhaite réserver un vol', 'Jeff', '2023-07-06', 'Houston', 'Toronto', '8am', "Oui s'il vous plaît"]
   
        for response in french_responses:
            chat_page.send_message(response)
        answer = chat_page.get_messages()
        assert translate_client.translate(english_confirmation_msg, 'fr') in answer

        chat_page.select_locale('es_US')
        spanish_responses = ['quiero reservar un vuelo', 'Jeff', '2023-07-06', 'Houston', 'Toronto', '8am', 'Sí']

        for response in spanish_responses:
            chat_page.send_message(response)

        answer = chat_page.get_messages()
        assert translate_client.translate(english_confirmation_msg, 'es') in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_slots_are_deleted(self, designer_login, region: str, dom_operator: DomOperator, stack_name: str):
        """
        Test slots are deleted in lex.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/configure-intent-and-slot-matching.html
        """
        qids = ['Slot.001','Slot.002','Slot.003']

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for qid in qids:
            if edit_page.check_question_exists_by_qid(qid):
                print(f'Deleting {qid}')
                edit_page.delete_question_by_qid(qid)

        edit_page.rebuild_lex()

        for qid in qids:
            assert not edit_page.check_question_exists_by_qid(qid)

        bot_name = stack_name + '_QnaBot'
        bot_locales = ['en_US', 'es_US', 'fr_CA']
        slot_names = ['QID-SLOTTYPE-Slot_dot_002', 'QID-SLOTTYPE-Slot_dot_003']

        lex_client = LexClient(region)
        assert lex_client.bot_slot_type_names_do_not_exist_for_all_locales(bot_name, slot_names, bot_locales) is True

    def test_create_response_card(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test response card is created using question designer.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/adding-images-to-your-answers.html
        """
        qid = 'Card.001'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message(question['q'][0])
        assert chat_page.has_element_with_xpath(f'//img[contains(@src,"{question["r"]["imageUrl"]}")]')
        for button in question["r"]["buttons"]:
            assert chat_page.has_element_with_xpath(f'//button//span[contains(string(), "{button["text"]}")]')
        cw_client.print_fulfillment_lambda_logs()

    def test_question_topic(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test question responds with correct response using topics.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/using-topics-to-support-follow-up-questions-and-contextual-user-journeys.html
        """
        qids = ['Topic.001','Topic.002','Topic.003','Topic.004']
        questions = [self.__get_question_by_qid(qid, loaded_questions) for qid in qids]
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for question in questions:
            self.__create_question(question, edit_page)
            edit_page.refresh_questions()

        chat_page = menu.open_chat_page()

        for question in questions:
            chat_page.send_message(question['q'][0])

        answer = chat_page.get_messages()

        for question in questions:
            assert question['a'] in answer
        cw_client.print_fulfillment_lambda_logs()

    def extract_integer_from_string(self, string: str) -> int:
        """
        Helper function to extract the count of times the question has been asked.

        Args:
            string (str): String to extract integer from.

        Returns:
            int: Integer extracted from string.
        """
        words = string.split()
        words.reverse()

        for index, word in enumerate(words):
            if word == 'times.':
                return int(words[index + 1])

    def test_response_handlebars(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test handlebars are evaluated correctly.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/integrating-handlebars-templates.html
        """
        qid = 'Handlebars.001'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        assert 'times' in answer

        first_interaction_count = self.extract_integer_from_string(answer)

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        second_interaction_count = self.extract_integer_from_string(answer)

        assert first_interaction_count + 1 == second_interaction_count
        cw_client.print_fulfillment_lambda_logs()

    @pytest.mark.skipif_version_less_than('5.5.0')
    def test_response_handlebars_getQuestion(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test handlebars getQuestion method returns the matched question.

        See: https://github.com/aws-solutions/qnabot-on-aws/issues/397
        """
        qid = 'Handlebars.002'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_last_message_text()
        assert 'It seems like you are asking about: How do I use handlebars to return a matched question?' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_filter(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test filter setting works correctly by not answering questions with provided answer if too many nouns are provided (75% matching when > 2) 
        and does not match when nouns do not match.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/keyword-filters-and-custom-dont-know-answers.html
        """
        qid = 'Topic.001'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()
        settings_page.enable_filter()
        settings_page.set_match_criteria('2<75%')

        chat_page = menu.open_chat_page()

        chat_page.send_message('What is Amazon Astro the robot that has Alexa?')
        answer = chat_page.get_messages()
        assert question['a'] not in answer

        chat_page.send_message('What is Amazon astronomy?')
        answer = chat_page.get_messages()
        assert question['a'] not in answer

        chat_page.send_message('What is Amazon Astro the robot?')
        answer = chat_page.get_messages()
        assert question['a'] in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_elicit_response(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test response is elicited from client when prompted.

        See: https://catalog.us-east-1.prod.workshops.aws/workshops/20c56f9e-9c0a-4174-a661-9f40d9f063ac/en-US/qna/elicit-response
        """
        qids = ['Elicit.001','Elicit.002']
        questions = [self.__get_question_by_qid(qid, loaded_questions) for qid in qids]
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for question in questions:
            self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        name_responses = [questions[0]['q'][0], 'Jeff', 'Bezos', 'yes']
        age_responses = [questions[1]['q'][0], '12', 'No']

        for response in name_responses:
            chat_page.send_message(response)

        answer = chat_page.get_messages()
        assert questions[0]['a'] in answer
        assert 'Did I get your name right (Yes or No) Jeff Bezos?'

        for response in age_responses:
            chat_page.send_message(response)

        answer = chat_page.get_messages()
        assert 'Hello Jeff – What is your age in years?' in answer
        assert 'Is 12 correct (Yes or No)?' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_question_branching(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test question branches to next question based on conditional age.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/configuring-the-chatbot-to-ask-the-questions-and-use-response-bots.html#advancing-and-branching-through-a-series-of-questions
        """
        qids = ['Elicit.003','Elicit.004']
        edit_qid = 'Elicit.002'
        questions = [self.__get_question_by_qid(qid, loaded_questions) for qid in qids]
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for question in questions:
            self.__create_question(question, edit_page)
            edit_page.refresh_questions()
        time.sleep(2)
        assert edit_page.check_question_exists_by_qid(edit_qid)
        edit_question = self.__get_question_by_qid(edit_qid, loaded_questions)

        edit_question['conditionalChaining'] = '(SessionAttributes.age_of_user.Age< 18) ? "Under 18\" : "Over 18 answer"'

        edit_page.edit_question_by_qid(**edit_question)

        chat_page = menu.open_chat_page()

        age_responses = ['ask my age', '12', 'Yes', 'ask my age', '20', 'Yes']

        for response in age_responses:
            chat_page.send_message(response)

        answer = chat_page.get_messages()
        assert questions[0]['a'] in answer
        assert questions[1]['a'] in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_rich_text(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Answers are provided in rich text using markdown.

        See: https://docs.aws.amazon.com/solutions/latest/aws-qnabot/displaying-rich-text-answers.html
        """

        qid = 'Markdown.001'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        link_xpath = '//a[@href="https://www.markdownguide.org/cheat-sheet/" and contains(string(), "Markdown Cheat Sheet")]'
        title_xpath = '//h1[contains(string(), "Markdown")]'
        italics_xpath = '//em[contains(string(), "dynamic")]'
        bold_xpath = '//strong[contains(string(), "bold text")]'
        blockquote_xpath = '//blockquote[contains(string(), "blockquote")]'
        ordered_list_xpath = '//ol//li[contains(string(), "First item")]'
        horizontal_rule_xpath = '//div[@class="message-text"]//hr'
        unordered_list_xpath = '//ul//li[contains(string(), "First item")]'
        table_header_xpath = '//table//thead//tr//th[contains(string(), "Syntax")]'
        code_xpath = '//code[contains(string(), "firstName")]'
        checkbox_xpath = '//ul//li//input[@type="checkbox"]'
        image_xpath = '//img[@src="https://github.com/aws-solutions/qnabot-on-aws/blob/main/assets/examples/photos/west%20coast%20grocery.jpg?raw=true" and @alt="West Coast Grocery"]'
        iframe_xpath = '//iframe[@src="https://www.youtube.com/embed/OE4MrFx2XCs"]'

        markdown_element_xpaths = [
            link_xpath, 
            title_xpath, 
            italics_xpath, 
            bold_xpath,
            blockquote_xpath, 
            ordered_list_xpath, 
            horizontal_rule_xpath, 
            unordered_list_xpath, 
            table_header_xpath, 
            code_xpath, 
            checkbox_xpath, 
            image_xpath, 
            iframe_xpath
        ]
    
        chat_page.send_message(question['q'][0])

        for element_xpath in markdown_element_xpaths:
            assert chat_page.has_element_with_xpath(element_xpath)
        cw_client.print_fulfillment_lambda_logs()

    def test_lambda_hooks(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test lambda hook is invoked and appended to answer correctly.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/specifying-lambda-hook-functions.html
        """
        hook_question = 'What are lambda hooks'

        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()
        import_page.import_greeting_hook()

        edit_page = menu.open_edit_page()
        bot_questions = edit_page.select_question_by_qid('GreetingHookExample', 4).text

        assert bot_questions == hook_question

        chat_page = menu.open_chat_page()
        
        chat_page.send_message(hook_question)
        answer = chat_page.get_messages()
        assert 'good afternoon' in answer or 'good morning' in answer or 'good evening' in answer
        cw_client.print_fulfillment_lambda_logs()
