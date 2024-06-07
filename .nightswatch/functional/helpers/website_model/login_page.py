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
from helpers.website_model.edit_page import EditPage
from helpers.website_model.chat_page import ChatPage

LOGOUT_ID = 'div-logout'
USERNAME_ID = 'signInFormUsername'
PASSWORD_ID = 'signInFormPassword'
SUBMIT_BUTTON_NAME = "signInSubmitButton"

class LoginPage:
    """Class representing a LoginPage that provides a way to log into the AWS cognito interface.

    This class offers a method to log in to the AWS cognito interface using credentials. 
    It can handle login for two URLs - Question Designer and the Client Chat Bot. 

    Attributes:
        operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
        url (str): The URL of the destination page.
    """

    def __init__(self, operator: DomOperator, url) -> None:
        """
        Initializes LoginPage with a DomOperator instance and a URL.
        
        Args:
            operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
            url (str): The URL of the destination page.
        """

        self.operator = operator
        self.url = url

    def __is_client(self):
        """
        Private method to determine if the current URL represents the client Chat Bot page.
        
        Returns:
            bool: True if the url is for the client, False otherwise.
        """

        return 'client.html' in self.url

    def login(self, username, password) -> str:
        """
        Performs the login operation with the given credentials and returns the title of the loaded page.
        
        Args:
            username (str): The username to log in.
            password (str): The password for the given username.

        Returns:
            str: The title of the page after successful login.
        """
        
        self.operator.get_url(self.url) 
        self.operator.wait_for_element_by_id(USERNAME_ID, delay=5)
        self.operator.set_window_size(800, 800)
        designer_page = self.operator.select_xpath('/html/body')

        if self.operator.get_title() == 'QnABot Client' or self.operator.get_title() == 'QnABot Designer':
            return self.operator.get_title()

        if 'Sign In as' in designer_page.text:
            self.operator.select_id(LOGOUT_ID, click=True)

        self.operator.select_id(USERNAME_ID).send_keys(username)
        self.operator.select_id(PASSWORD_ID).send_keys(password)
        self.operator.select_name(SUBMIT_BUTTON_NAME, click=True)

        # Instantiating pages to wait for page readiness before exiting function
        if self.__is_client():
            ChatPage(self.operator)
        else:
            EditPage(self.operator)

        output = self.operator.get_title()
        
        if self.operator.element_exists_by_id('loginErrorMessage'):
            if password == 'invalidPassword':
                output = (output, self.operator.select_id('loginErrorMessage').text)
            else:
                raise RuntimeError(self.operator.select_id('loginErrorMessage').text)
        return output