######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import pytest
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator
from helpers.cloud_watch_client import CloudWatchClient


class TestLambdaHooks:

    def test_setup(self, designer_login, dom_operator: DomOperator):
        """
        Overrides deployment settings before running other tests.
        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.reset_settings()
        settings_page.expand_all_subgroups()
        assert 'Success' in settings_page.disable_embeddings()
        assert 'Success' in settings_page.set_post_processing_lambda('')

    def test_pre_processing_lambda_hooks(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient, lambda_hook_example_arn: str):
        """
        Test pre-process lambda hook is invoked and appended to answer correctly.

        See: https://github.com/aws-solutions/qnabot-on-aws/issues/651
        """
        hook_question = 'How do I modify Q and A Bot content'

        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()

        assert 'Success' in settings_page.set_pre_processing_lambda(lambda_hook_example_arn)

        chat_page = menu.open_chat_page()
        
        chat_page.send_message(hook_question)
        answer = chat_page.get_last_message_text()
        assert 'Use the Content Designer Question and Test tools to find your existing documents and edit them directly in the console.' in answer
        cw_client.print_fulfillment_lambda_logs()

    @pytest.mark.skipif_version_less_than('5.5.0')
    def test_post_processing_lambda_hooks(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient, lambda_hook_example_arn: str):
        """
        Test post-process lambda hook is invoked and appended to answer correctly.
        """
        hook_question = 'How do I modify Q and A Bot content'

        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()

        assert 'Success' in settings_page.set_post_processing_lambda(lambda_hook_example_arn)

        chat_page = menu.open_chat_page()
        
        chat_page.send_message(hook_question)
        answer = chat_page.get_last_message_text()
        assert 'Hi! This is your Custom Javascript Hook speaking!' in answer
        cw_client.print_fulfillment_lambda_logs()

    def test_cleanup(self, designer_login, dom_operator: DomOperator, ):
        """
        Removes lambda hook settings.
        """
        menu = MenuNav(dom_operator)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()

        assert 'Success' in settings_page.set_pre_processing_lambda('')
        assert 'Success' in settings_page.set_post_processing_lambda('')
