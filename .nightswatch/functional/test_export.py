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

