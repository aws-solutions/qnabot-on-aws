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
import os

from helpers.kendra_client import KendraClient
from helpers.cloud_watch_client import CloudWatchClient
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator
from helpers.website_model.chat_page import ChatPage

region = os.environ.get('CURRENT_STACK_REGION')
kendra_regions = ['us-east-1', 'us-west-2', 'ap-southeast-1', 'ap-southeast-2', 'ca-central-1', 'eu-west-1']
unsupported_region_reason = 'Region Not Supported'

QUESTION_FILEPATH = './question_bank/kendra_questions.json'

KENDRA_ANSWER_MESSAGE = 'While I did not find an exact answer, these search results from Amazon Kendra might be helpful.'

@pytest.mark.skipif(region not in kendra_regions, reason=unsupported_region_reason)
@pytest.mark.skipif_kendra_not_enabled()
class TestKendra:

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
    
    def test_setup(self, designer_login, dom_operator: DomOperator):
        """
        Overrides deployment settings before running other tests.
        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        assert 'Success' in  settings_page.enable_filter()
        assert 'Success' in settings_page.disable_embeddings()
        assert 'Success' in settings_page.disable_llm()
        assert 'Success' in settings_page.enable_kendra('https://developer.amazon.com/en-US/alexa,https://www.amazon.com/s?k=kindle', doc_count=1)

    def test_sync_kendra_faq(self, designer_login, dom_operator: DomOperator):
        """
        Test that the FAQ is synced using the Kendra page sync button.
        """
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()
        status = edit_page.sync_kendra_faq()
        assert status == 'Success!'

    def test_kendra_service_faq(self, kendra_client: KendraClient):
        """
        Test the FAQ is successfully created and active.
        """
        response = kendra_client.list_faqs()
        faq_summary_items = response['FaqSummaryItems']
        for faq_summary_item in faq_summary_items:
            faq_name = faq_summary_item['Name']
            faq_status = faq_summary_item['Status']

        assert faq_name == 'qna-facts' and faq_status == 'ACTIVE'

    def test_delete_kendra_faq(self, kendra_client: KendraClient):
        """
        Test the FAQ is successfully deleted.
        """
        response = kendra_client.list_faqs()
        faq_summary_items = response['FaqSummaryItems']
        for faq_summary_item in faq_summary_items:
            faq_id = faq_summary_item['Id']

        response = kendra_client.delete_faq_by_id(faq_id)
        status = response['ResponseMetadata']['HTTPStatusCode']
        assert status == 200

    def test_start_crawling(self, designer_login, dom_operator: DomOperator):
        """
        Test that the web crawler is started.

        Required for the next step.
        """
        menu = MenuNav(dom_operator)
        kendra_page = menu.open_kendra_page()
        status = kendra_page.index()

        attempts = 1
        max_attempts = 3
        while 'SYNCING' not in status:
            wait = 1 * 2 ** attempts
            print(f'Current status is: {status}. Waiting {wait}ms after {attempts} unsuccessful attempts.')
            time.sleep(wait)
            status = kendra_page.index()
            attempts += 1

            if attempts == max_attempts:
                break

        assert 'SYNCING' in status

    def test_kendra_data_sources_status(self, kendra_client: KendraClient):
        """
        Test that the data sources are successfully created and active.
        """
        timeout = 60
        check_every = 30
        elapsed_time = 0
        status = ['INACTIVE']

        while elapsed_time <= timeout:
            response = kendra_client.list_data_sources()
            status = [ summary_item['Status'] for summary_item in response['SummaryItems'] ]

            if all(state == 'ACTIVE' for state in status):
                break

            time.sleep(check_every)
            elapsed_time += check_every

        assert all(state == 'ACTIVE' for state in status) == True

    def test_kendra_data_sources_results(self, kendra_client: KendraClient):
        """
        Test that the data sources return results based on a query.
        """
        timeout = 600
        check_every = 30
        elapsed_time = 0
        queries = ['Amazon Kindle', 'Alexa AND "custom skill"']
        kendra_results = [0, 0]

        while elapsed_time <= timeout:
            kendra_results = [kendra_client.query(query)['TotalNumberOfResults'] for query in queries]

            if all(result > 0 for result in kendra_results):
                break

            time.sleep(check_every)
            elapsed_time += check_every

        assert all(result > 0 for result in kendra_results) == True

    def test_kendra_fallback(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test that the Kendra fallback is used when no answer is found.

        See: https://github.com/aws-solutions/aws-qnabot/blob/main/docs/Kendra_Fallback_README.md
        """
        menu = MenuNav(dom_operator)
        kendra_page = menu.open_kendra_page()
        timeout = 300
        check_every = 60
        elapsed_time = 0
        while elapsed_time <= timeout:
            status = kendra_page.get_crawling_status()
            if 'SYNCING' not in status:
                break
            time.sleep(check_every)
            elapsed_time += check_every

        chat_page = menu.open_chat_page()

        chat_page.send_message('How can I publish Kindle books?')
        answer = chat_page.get_messages()
        assert KENDRA_ANSWER_MESSAGE in answer
        assert 'Source Link:' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_kendra_redirect(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test the Kendra query contained in the qna is used instead of Kendra fallback when there is a question match.

        See: https://github.com/aws-solutions/qnabot-on-aws/tree/main/docs/kendra_redirect
        """
        qid = 'Kendra.001'
        question = self.__get_question_by_qid(qid, loaded_questions)
        
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        self.__create_question(question, edit_page)

        chat_page = menu.open_chat_page()

        chat_page.send_message(question['q'][0])
        answer = chat_page.get_messages()
        assert 'Alexa' in answer
        cw_client.print_fulfillment_lambda_logs()

    @pytest.mark.skipif_llm_not_enabled()
    def test_kendra_llm_retrieval(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test the Kendra LLM retrieval. This test is meant to catch a bug with Kendra LLM retrieval where the message 
        sent to the LLM has too many tokens. 

        """
        start_time = time.time()
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.enable_llm()
        no_hits_response = settings_page.get_no_hits_response()

        chat_page = menu.open_chat_page()

        chat_page.send_message('publish kindle')
        answer = chat_page.get_last_message_text()
        assert no_hits_response not in answer
        assert len(answer) > 0
        cw_client.print_fulfillment_lambda_logs()