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
import pathlib
import time
import json

from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator
class TestImport:

    def test_setup(self, designer_login, dom_operator: DomOperator):
        qids = ['Import.001', 'Import.004', 'Import.006', 'Import.007']
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()

        for qid in qids:
            if edit_page.check_question_exists_by_qid(qid):
                edit_page.delete_question_by_qid(qid)

    def test_designer_import_questions(self, designer_login, dom_operator: DomOperator):
        """
        Test that designer can import questions from the import page.
        """
        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()
        import_page.import_blog_examples()
        edit_page = menu.open_edit_page()
        bot_questions = edit_page.select_question_by_qid('Admin.001', 4).text

        assert bot_questions == 'How do I modify Q and A Bot content'

    def test_designer_import_questions_json(self, designer_login, dom_operator: DomOperator):
        """
        Test that designer can import questions from the import page using JSON format.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/importing-and-exporting-chatbot-answers.html
        """
        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()

        json_file = f'{pathlib.Path().resolve()}/question_bank/import_questions.json'
        import_page.import_file(json_file)

        edit_page = menu.open_edit_page()
        edit_page.refresh_questions()

        validation_file = open(json_file)
        expected_question = json.load(validation_file)['qna'][0]
        validation_file.close()

        assert edit_page.check_question_exists_by_qid(expected_question['qid'])
        assert edit_page.match_question_field_values(**expected_question)
        # Need to clean up after test since the question is hidden in the DOM and can still be selected in other tests
        edit_page.delete_question_by_qid(expected_question['qid'])

    def test_designer_import_questions_xlsx(self, designer_login, dom_operator: DomOperator):
        """
        Test that designer can import questions from the import page using xlsx format.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/importing-and-exporting-chatbot-answers.html
        """
        qids = ['Import.002', 'Import.003']
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()
        for qid in qids:
            if edit_page.check_question_exists_by_qid(qid):
                edit_page.delete_question_by_qid(qid)

        import_page = menu.open_import_page()
        xlsx_file = f'{pathlib.Path().resolve()}/files/import-pass.xlsx'
        import_page.import_file(xlsx_file)
        edit_page = menu.open_edit_page()

        bot_questions = edit_page.select_question_by_qid(qids[0], 4).text
        assert bot_questions == 'How do I import questions in content designer?'

        bot_questions = edit_page.select_question_by_qid(qids[1], 4).text
        assert bot_questions == 'Can I import multiple answers when I import with excel?'

        validation_file = open('./files/import-pass-expected.json')
        expected_questions = json.load(validation_file)['qna']
        validation_file.close()
        for question in expected_questions:
            assert edit_page.match_question_field_values(**question)

    def test_designer_import_questions_xlsx_fail(self, designer_login, dom_operator: DomOperator):
        """
        Test that designer responds back with errors when questions cannot be imported using xlsx format.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/importing-and-exporting-chatbot-answers.html
        """
        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()

        xlsx_file = f'{pathlib.Path().resolve()}/files/import-fail.xlsx'
        import_page.import_file(xlsx_file)
        error = import_page.get_import_file_error()

        assert 'Error Loading Content' in error
        assert 'Warning: No questions found for QID: "NoQuestionWarning". The question will be skipped.' in error
        assert 'Warning: No answer found for QID:"NoAnswerWarning". The question will be skipped.' in error
        assert 'Warning: No QID found for line 4. The question will be skipped.' in error

    def test_designer_import_questions_qna(self, designer_login, dom_operator: DomOperator):
        """
        Test that designer can import QNA type questions from the import page using JSON format.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/importing-and-exporting-chatbot-answers.html
        """
        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()

        json_file = f'{pathlib.Path().resolve()}/question_bank/import_questions_qna.json'
        import_page.import_file(json_file)

        edit_page = menu.open_edit_page()
        edit_page.refresh_questions()

        validation_file = open(json_file)
        expected_question = json.load(validation_file)['qna'][0]
        validation_file.close()

        assert edit_page.check_question_exists_by_qid(expected_question['qid'])
        assert edit_page.match_question_field_values(**expected_question)
        # Need to clean up after test since the question is hidden in the DOM and can still be selected in other tests
        edit_page.delete_question_by_qid(expected_question['qid'])

    @pytest.mark.skip(reason='Bug in import page')
    def test_designer_import_questions_quiz(self, designer_login, dom_operator: DomOperator):
        pass

    def test_designer_import_questions_slot(self, designer_login, dom_operator: DomOperator):
        """
        Test that designer can import slot type questions from the import page using JSON format.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/importing-and-exporting-chatbot-answers.html
        """
        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()

        json_file = f'{pathlib.Path().resolve()}/question_bank/import_questions_slot.json'
        import_page.import_file(json_file)

        edit_page = menu.open_edit_page()
        edit_page.refresh_questions()

        validation_file = open(json_file)
        expected_question = json.load(validation_file)['qna'][0]
        validation_file.close()

        assert edit_page.check_question_exists_by_qid(expected_question['qid'])
        assert edit_page.match_question_field_values(**expected_question)
        # Need to clean up after test since the question is hidden in the DOM and can still be selected in other tests
        edit_page.delete_question_by_qid(expected_question['qid'])

    def test_designer_import_questions_text(self, designer_login, dom_operator: DomOperator):
        """
        Test that designer can import text type questions from the import page using JSON format.

        See: https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/importing-and-exporting-chatbot-answers.html
        """
        menu = MenuNav(dom_operator)
        import_page = menu.open_import_page()

        json_file = f'{pathlib.Path().resolve()}/question_bank/import_questions_text.json'
        import_page.import_file(json_file)

        edit_page = menu.open_edit_page()
        edit_page.refresh_questions()

        validation_file = open(json_file)
        expected_question = json.load(validation_file)['qna'][0]
        validation_file.close()

        assert edit_page.check_question_exists_by_qid(expected_question['qid'])
        assert edit_page.match_question_field_values(**expected_question)
        # Need to clean up after test since the question is hidden in the DOM and can still be selected in other tests
        edit_page.delete_question_by_qid(expected_question['qid'])
