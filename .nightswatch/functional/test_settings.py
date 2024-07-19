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

from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator

QUESTION_FILEPATH = './question_bank/settings_questions.json'

class TestSettings:

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
    
    def test_custom_response(self, designer_login, loaded_questions: list[dict], dom_operator: DomOperator):
        """
        Tests the custom empty response setting can be overwritten.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/using-keyword-filters-for.html
        """
        custom_empty_message = "Sorry, I don't know that"
        edit_qid = 'CustomNoMatches'

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()
        
        assert edit_page.check_question_exists_by_qid(edit_qid)
        edit_question = self.__get_question_by_qid(edit_qid, loaded_questions)

        edit_question['a'] = custom_empty_message

        edit_page.edit_question_by_qid(**edit_question)
        settings_page = menu.open_settings_page()
        settings_page.expand_all_subgroups()
        settings_page.customize_empty_message(custom_empty_message)
        settings_page.disable_kendra_fallback()

        chat_page = menu.open_chat_page()
        chat_page.send_message('Gobbledygook Eellogofusciouhipoppokunurious Anachronism')
        answer = chat_page.get_messages()

        assert custom_empty_message in answer

    @pytest.mark.skip(reason="Not implemented")
    def test_create_setting(self):
        """
        Tests the create setting feature.
        """
        pass

    @pytest.mark.skip(reason="Not implemented")
    def test_import_settings(self):
        """
        Tests the import settings feature.
        """
        pass

    @pytest.mark.skip(reason="Not implemented")
    def test_export_settings(self):
        """
        Tests the export settings feature.
        """
        pass

    @pytest.mark.skip(reason="Not implemented")
    def test_reset_settings(self):
        """
        Tests the reset settings feature.
        """
        pass

    @pytest.mark.skip(reason="Not implemented")
    def test_match_settings(self):
        """
        Tests the number of nouns must match setting can be set.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/modifying-configuration-settings.html
        """
        pass

    @pytest.mark.skip(reason="Not implemented")
    def test_pii_rejection(self):
        """
        Tests the PII rejection setting can be set.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/modifying-configuration-settings.html
        """
        pass

    @pytest.mark.skip(reason="Not implemented")
    def test_redaction(self):
        """
        Tests that custom terms are redacted in logs.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/modifying-configuration-settings.html
        """
        pass
