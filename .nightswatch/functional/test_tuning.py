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
import time
from datetime import datetime
from selenium.webdriver.common.by import By

from helpers.s3_client import S3Client
from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator

TEST_ALL_DEFAULT_ID_PREFIX = "test-job-TestAll-"


class TestTuning:
# https://docs.aws.amazon.com/solutions/latest/aws-qnabot/tuning-testing-and-troubleshooting.html

    def test_test_all(self, designer_login, dom_operator: DomOperator, s3_client: S3Client, content_designer_output_bucket_name):
        """
        Tests the test all functionality.
        """
        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()
        edit_page.select_test_all_tab()
        testall_response = edit_page.generate_test_report()
        report_status = testall_response.text
        assert 'Completed' in report_status
        file_name = f'status-testall/{testall_response.get_property("id").split("test-job-")[1]}'
        number_of_versions = s3_client.get_file_versions_count(content_designer_output_bucket_name, file_name)
        assert number_of_versions == 4


    def test_test_single(self, designer_login, dom_operator: DomOperator):
        """
        Tests the test single functionality.
        """

        # Import test must be successful for this question to be available
        blog_question = 'What is Q and A Bot'

        menu = MenuNav(dom_operator)
        edit_page = menu.open_edit_page()
        edit_page.select_test_tab()
        edit_page.execute_test_query(blog_question)

        top_question = edit_page.select_question_by_row_and_column(1, 4).text

        # Wait for the query to finish
        attempts = 1
        max_attempts = 3
        while blog_question not in top_question:
            wait = 1 * 2 ** attempts
            time.sleep(wait)
            top_question = edit_page.select_question_by_row_and_column(1, 4).text
            attempts += 1

            if attempts == max_attempts:
                break

        assert blog_question in top_question
        top_score = edit_page.select_question_by_row_and_column(1, 1).text
        assert float(top_score) >= 1
