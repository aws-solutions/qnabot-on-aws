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

from helpers.cloud_watch_client import CloudWatchClient
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator


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

    def test_knowledge_base_fallback(self, designer_login, dom_operator: DomOperator, cw_client: CloudWatchClient):
        """
        Test that the Knowledge Base fallback is used when no answer is found. LLM should respond with correct answer as well as source links and context which should be enabled by default.

        """
        menu = MenuNav(dom_operator)
        chat_page = menu.open_chat_page()

        chat_page.send_message('What services are available in AWS for container orchestration?')
        answer = chat_page.get_last_message_text()
        assert 'ECS' in answer
        assert 'EKS' in answer
        assert 'Source Link:' in answer
        assert 'Context' in answer
        assert 'aws-overview.pdf' in answer
        cw_client.print_fulfillment_lambda_logs()
