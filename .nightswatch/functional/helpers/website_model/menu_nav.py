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

from helpers.website_model.edit_page import EditPage
from helpers.website_model.import_page import ImportPage
from helpers.website_model.export_page import ExportPage
from helpers.website_model.settings_page import SettingsPage
from helpers.website_model.kendra_page import KendraPage
from helpers.website_model.custom_terminology_page import CustomTerminologyPage
from helpers.website_model.dom_operator import DomOperator
from helpers.website_model.login_page import LoginPage
from helpers.website_model.chat_page import ChatPage

MENU_ID = 'nav-open'
LOGOUT_ID = 'logout-button'
EDIT_PAGE_ID = 'page-link-edit'
EDIT_ID = 'page-link-edit'
EXPORT_PAGE_ID = 'page-link-export'
IMPORT_PAGE_ID = 'page-link-import'
SETTINGS_ID = 'page-link-settings'
KENDRA_ID = 'page-link-kendraIndexing'
CUSTOM_TERM_ID = 'page-link-customTranslate'
CHAT_ID = 'page-link-client'
TEST_ALL_ID = 'testAll-tab'

class MenuNav:
    """Class representing a Menu Navigation Bar.

    This class provides a way to navigate through different pages in the application by selecting menu options. 
    It is used across all administrative pages.

    Attributes:
        operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
    """

    def __init__(self, operator: DomOperator) -> None:
        """
        Initializes the MenuNav with a DomOperator instance.
        
        Args:
            operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
        """

        self.operator = operator

    def select_menu(self) -> None:
        """Selects the menu in the navigation bar."""

        self.operator.click_element_by_id(MENU_ID, wait=10)

    def __from_menu_select_item(self, item: str) -> None:
        """
        Private method to select an item from the menu.
        
        Args:
            item (str): The CSS selector of the menu item to be selected.
        """

        self.operator.select_css(item, wait=10, click=True)

    def logout(self) -> LoginPage:
        """Logs out the current user and returns the LoginPage instance."""
        self.operator.select_id(LOGOUT_ID, wait=10, click=True)
        return LoginPage(self.operator, self.operator.get_current_url())

    def open_import_page(self) -> ImportPage:
        """Opens the ImportPage through the menu and returns its instance."""

        self.select_menu()
        self.operator.select_id(IMPORT_PAGE_ID, wait=10, click=True)
        return ImportPage(self.operator)

    def open_export_page(self) -> ExportPage:
        """Opens the ExportPage through the menu and returns its instance."""

        self.select_menu()
        self.operator.select_id(EXPORT_PAGE_ID, wait=10, click=True)
        return ExportPage(self.operator)

    def open_edit_page(self) -> EditPage:
        """Opens the EditPage through the menu and returns its instance."""

        self.select_menu()
        self.operator.wait_for_element_by_id(EDIT_ID)
        self.operator.click_element_by_id(EDIT_PAGE_ID, wait=10)
        return EditPage(self.operator)
    
    def open_settings_page(self) -> SettingsPage:
        """Opens the SettingsPage through the menu and returns its instance."""

        self.select_menu()
        self.operator.select_id(SETTINGS_ID, wait=10, click=True)
        return SettingsPage(self.operator)
    
    def open_kendra_page(self) -> KendraPage:
        """Opens the KendraPage through the menu and returns its instance."""

        self.select_menu()
        self.operator.select_id(KENDRA_ID, wait=10, click=True)
        return KendraPage(self.operator)
    
    def open_custom_terminology(self) -> CustomTerminologyPage:
        """Opens the CustomTerminologyPage through the menu and returns its instance."""

        self.select_menu()
        self.operator.select_id(CUSTOM_TERM_ID, wait=10, click=True)
        return CustomTerminologyPage(self.operator)
    
    def open_chat_page(self) -> ChatPage:
        """Opens the ChatPage through the menu, switches to its window and returns its instance."""
        
        self.select_menu()
        self.operator.click_element_by_id(CHAT_ID, wait=10)
        time.sleep(5)
        self.operator.switch_windows()
        return ChatPage(self.operator)

    def open_testall_page(self) -> None:
        """Opens the TestAllPage through navigation bar."""

        self.operator.click_element_by_id(TEST_ALL_ID, wait=10)
        time.sleep(5)
