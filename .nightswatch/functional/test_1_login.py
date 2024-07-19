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
import os

from helpers.cognito_client import CognitoClient
from helpers.website_model.menu_nav import MenuNav
from helpers.cfn_parameter_fetcher import ParameterFetcher
from helpers.cognito_client import CognitoClient
from helpers.website_model.dom_operator import DomOperator

class TestLogin:

    @pytest.mark.skipif(os.getenv("USER") != None and os.getenv("PASSWORD") != None, reason="Skipping user creation; user provided.")
    def test_admin_user_creation(self, region: str, param_fetcher: ParameterFetcher, username: str, temporary_password: str, password: str, email: str):
        """
        Test creates a user and updates the password
        """
        
        cognito_client = CognitoClient(region, param_fetcher.get_user_pool_id(), param_fetcher.get_designer_client_id())
        admin_user_code_create_auth = cognito_client.create_admin_and_set_password(username, temporary_password, password, email)
        
        assert admin_user_code_create_auth == 200

    def test_invalid_designer_login(self, invalid_designer_login):
        """
        Test invalid login to designer
        """
        title = invalid_designer_login
        assert title[0] == 'Signin'
        assert title[1] == 'Incorrect username or password.'

    def test_designer_login(self, designer_login):
        """
        Test login to designer
        """
        title = designer_login
        assert title == 'QnABot Designer'

    def test_designer_logout(self, designer_login, dom_operator: DomOperator):
        """
        Test logout from designer
        """
        menu = MenuNav(dom_operator)
        time.sleep(10)
        menu.logout()
        time.sleep(3)
        current_url = dom_operator.get_current_url()
        element = dom_operator.select_css('span.textDescription-customizable')

        title = dom_operator.get_title()
        assert title == 'Signin'
        assert 'login' in current_url
        assert element.text == 'Sign in with your username and password'

    def test_client_login(self, client_login, dom_operator: DomOperator):
        """
        Test login to client
        """
        title = client_login
        url = dom_operator.get_current_url()
        assert title == 'QnABot Client'
        assert 'code' in url

    def test_invalid_client_login(self, invalid_client_login):
        """
        Test invalid login to client
        """
        title = invalid_client_login
        assert title[0] == 'Signin'
        assert title[1] == 'Incorrect username or password.'

