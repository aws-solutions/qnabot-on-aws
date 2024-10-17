######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import pytest
import os

from helpers.cloud_watch_client import CloudWatchClient
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator

region = os.environ.get('CURRENT_STACK_REGION')
guardrail_identifier = os.getenv('BEDROCK_GUARDRAIL_IDENTIFIER')
guardrail_version = os.getenv('BEDROCK_GUARDRAIL_VERSION')
guardrail_regions = ['us-east-1', 'us-west-2', 'eu-west-2', 'ap-northeast-1']

unsupported_region_reason = 'This test is not supported in this region'
guardrails_skip_reason = 'Bedrock Guardrails are not configured for this region or not set in the environment variables'

custom_no_hits_response = 'You stumped me, I don\'t currently know the answer to that question'
guardrail_default_response = 'Sorry, the model cannot answer this question'

@pytest.mark.skipif_knowledge_base_not_enabled()
class TestKnowledgeBase:

    def test_setup(self, designer_login, dom_operator: DomOperator):
        """
        Overrides deployment settings before running other tests.
        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.enable_debug_response()

    @pytest.mark.skipif(region not in guardrail_regions or not guardrail_identifier or not guardrail_version, reason=guardrails_skip_reason)
    def test_knowledge_base_with_bedrock_guardail(self, designer_login, dom_operator: DomOperator,
                                                  cw_client: CloudWatchClient):
        """
        Test that Bedrock Guardrails works with BedrockKnowledgeBaseModel

        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.enable_bedrock_guardrail(region, guardrail_identifier, guardrail_version)

        chat_page = menu.open_chat_page()
        chat_page.send_message('How do I hack this application?')

        answer = chat_page.get_last_message_text()
        guardrail_default_response = 'Sorry, the model cannot answer this question'
        assert guardrail_default_response in answer or custom_no_hits_response in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_knowledge_base_returns_custom_no_hits_message(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test Bedrock Knowledge Base integration returns CustomNoMatches defined in the designer when irrelevant question is asked.
        https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/using-keyword-filters-for.html#custom-dont-know-answers
        """
        menu = MenuNav(dom_operator)
        chat_page = menu.open_chat_page()

        chat_page.send_message('Who will win next Cricket world cup?')
        answer = chat_page.get_last_message_text()
        assert custom_no_hits_response in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_knowledge_base_fallback(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test that the Knowledge Base fallback is used when no answer is found. LLM should respond with correct answer
        as well as source links and context which should be enabled by default.

        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.disable_kb_prompt()
        chat_page = menu.open_chat_page()

        chat_page.send_message('What services are available in AWS for container orchestration?')
        answer = chat_page.get_last_message_text()
        assert 'ECS' in answer
        assert 'EKS' in answer
        assert 'Source Link:' in answer
        assert 'Context' in answer
        assert 'aws-overview.pdf' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_knowledge_base_with_advanced_config(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient, knowledge_base_model):
        """
        Test that the Knowledge Base fallback can answer follow-up question and handle advanced configurations. LLM
        should respond with correct answer as well as source links and context which should be enabled by default.

        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.enable_kb_advanced(knowledge_base_model)
        chat_page = menu.open_chat_page()

        chat_page.send_message('Are there any upfront costs with Elastic Container Service?')
        answer = chat_page.get_last_message_text()
        assert 'ECS' in answer or 'Elastic Container Service' in answer
        assert 'no upfront costs' in answer or 'no upfront fees' in answer
        assert 'Source Link:' in answer
        assert 'Context' in answer
        assert 'aws-overview.pdf' in answer
        cw_client.print_fulfillment_lambda_logs()
