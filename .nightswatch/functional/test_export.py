######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import pytest

from helpers.website_model.menu_nav import MenuNav
from helpers.website_model.dom_operator import DomOperator

class TestExport:
# https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/importing-and-exporting-chatbot-answers.html

    def test_designer_export_questions(self, designer_login, dom_operator: DomOperator):
        """
        Test export questions using the designer.
        """
        menu = MenuNav(dom_operator)
        export_page = menu.open_export_page()
        export_page.generate_export('export.json', 'Export')

