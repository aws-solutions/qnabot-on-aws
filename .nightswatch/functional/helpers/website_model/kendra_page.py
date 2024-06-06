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

import time
from helpers.website_model.dom_operator import DomOperator

KENDRA_INDEXING_BUTTON_XPATH = '//*[@id="btnKendraStartIndex"]'

KENDRA_INDEXING_BUTTON_ID = 'btnKendraStartIndex'

KENDRA_IMPORT_XPATH = '//div[@id="page-import"]//p'

SYNCING_TEXT = 'Current Status: SYNCING'

PAGE_READINESS_ELEMENT_XPATH = KENDRA_INDEXING_BUTTON_XPATH

class KendraPage:
    """Class representing a KendraPage that allows the admin user to trigger a re-index with Kendra.

    This class provides a method to initiate the re-indexing process and return its status.

    Attributes:
        operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
    """

    def __init__(self, operator: DomOperator) -> None:
        """
        Initializes KendraPage with a DomOperator instance.
        
        Args:
            operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
        """

        self.operator = operator
        self.__wait_to_load()

    def __wait_to_load(self):
        """
        A private method to wait for a page to load. Waits for a specific element 
        identified by its ID.
        """

        self.operator.wait_for_element_by_xpath(PAGE_READINESS_ELEMENT_XPATH)

    def index(self) -> None:
        """
        Triggers the re-indexing process with Kendra and returns the status of the operation.
        
        Returns:
            str: The status text of the re-indexing process.
        """
        
        # self.operator.wait_for_element_by_xpath(KENDRA_INDEXING_BUTTON_XPATH)
        time.sleep(2)
        self.operator.click_element_by_id(KENDRA_INDEXING_BUTTON_ID)
        self.operator.wait_for_element_by_xpath_text(KENDRA_IMPORT_XPATH, SYNCING_TEXT, delay=360)
        status = self.operator.select_xpath(KENDRA_IMPORT_XPATH).text
        return status
    
    def get_crawling_status(self) -> None:
        """
        Returns current Kendra crawling status
        
        Returns:
            str: Current Kendra crawling status
        """
        
        # self.operator.wait_for_element_by_xpath(KENDRA_INDEXING_BUTTON_XPATH)
        return self.operator.select_xpath(KENDRA_IMPORT_XPATH).text
