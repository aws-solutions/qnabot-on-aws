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

from helpers.website_model.dom_operator import DomOperator

IMPORT_EXAMPLES_MENU_XPATH = '//button[@class="v-expansion-panel-title"]'
IMPORT_EXAMPLES_BLOG_EXAMPLE_ID = 'example-blog-samples-final'
IMPORT_LANGUAGE_ID = 'example-Language'
IMPORT_GREETING_HOOK_ID = 'example-GreetingHook'
EXPANSION_MENU_XPATH = '//button[@class="v-expansion-panel-title v-expansion-panel-title--active"]'
UPLOAD_FILE_ID = 'upload-file'
ERROR_MODAL_ID = 'error-modal'

class ImportPage:
    """Class representing an ImportPage that allows the admin user to import questions.

    This class provides methods to expand examples, select examples, and import blog examples, language, and greeting hook.

    Attributes:
        operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
    """

    def __init__(self, operator: DomOperator) -> None:
        """
        Initializes ImportPage with a DomOperator instance.
        
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

        self.operator.wait_for_element_by_id(UPLOAD_FILE_ID)

    def __delete_existing_import_file_if_exists(self, file_name: str) -> None:
        """
        A private method to delete the existing import file if it exists.

        Args:
            file_name (str): The name of the file to be deleted.
        """
        file_element = f'//div[@id="import-job-{file_name}"]//button'

        if self.operator.element_exists_by_xpath(file_element):
            print(f'Deleting existing import file {file_name}')
            self.operator.select_xpath(file_element, click=True)

    def expand_examples(self) -> None:
        """
        Expands the examples section on the import page.
        """

        self.operator.select_xpath(IMPORT_EXAMPLES_MENU_XPATH, wait=10, click=True)
        self.operator.wait_for_element_by_xpath(EXPANSION_MENU_XPATH)

    def select_example(self, item: str) -> None:
        """
        Selects an example from the examples section on the import page.

        Args:
            item (str): The CSS selector of the example to be selected.
        """

        self.operator.select_css(item, wait=10, click=True)

    def import_file(self, file: str) -> None:
        """
        Imports a file on the import page.

        :param file: The path to the file to be uploaded.
        """

        file_name = file.split('/')[-1]
        file_element = f'//div[@id="import-job-{file_name}" and @data-status="Complete"]'

        self.__delete_existing_import_file_if_exists(file_name)
        self.operator.wait_for_element_by_id(UPLOAD_FILE_ID)
        self.operator.select_id(UPLOAD_FILE_ID).send_keys(file)
        try:
            self.operator.wait_for_element_by_xpath(file_element, delay=240)
        except Exception as e:
            print(f'Exception while waiting for import file element: {e}')
            self.operator.driver.switch_to.alert.accept()
            self.operator.wait_for_element_by_xpath(file_element, delay=240)

    def get_import_file_error(self) -> None:
        """
        Gets the error message from the error modal on the import page.
        """
        self.operator.wait_for_element_by_xpath(f'//div[@id="{ERROR_MODAL_ID}"]//li')
        return self.operator.select_id(ERROR_MODAL_ID).text

    def import_blog_examples(self) -> None:
        """
        Imports blog examples from the examples section on the import page.
        """

        self.expand_examples()
        self.operator.wait_for_element_by_id(IMPORT_EXAMPLES_BLOG_EXAMPLE_ID)
        self.operator.click_element_by_id(IMPORT_EXAMPLES_BLOG_EXAMPLE_ID)

    def import_language(self) -> None:
        """
        Imports language examples from the examples section on the import page.
        """

        self.expand_examples()
        self.operator.wait_for_element_by_id(IMPORT_LANGUAGE_ID)
        self.operator.click_element_by_id(IMPORT_LANGUAGE_ID)

    def import_greeting_hook(self) -> None:
        """
        Imports greeting hook examples from the examples section on the import page.
        """

        self.expand_examples()
        self.operator.wait_for_element_by_id(IMPORT_GREETING_HOOK_ID)
        self.operator.click_element_by_id(IMPORT_GREETING_HOOK_ID)