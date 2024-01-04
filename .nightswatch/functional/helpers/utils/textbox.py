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
from selenium.webdriver.common.keys import Keys

class Textbox:
    """
    Class representing a WebElement textbox.

    This class provides methods to interact with a WebElement textbox, such as getting its value and setting a new value.

    Attributes:
        element (selenium.webdriver.remote.webelement.WebElement): The WebElement representing the textbox.
    """

    def __init__(self, element) -> None:
        """
        Initializes the Textbox with a specific WebElement.

        Args:
            element (selenium.webdriver.remote.webelement.WebElement): The WebElement representing the textbox.
        """

        self.element = element

    def __send_keys(self, keys):
        """
        Private method to send specific keys to the textbox.

        Args:
            keys: The keys to send to the textbox.
        """

        self.element.send_keys(keys)

    def get_value(self) -> str:
        """
        Gets the current value of the textbox.

        Returns:
            str: The current value of the textbox.
        """

        return self.element.get_attribute("value")

    def set_value(self, value):
        """
        Sets a new value for the textbox.

        This method first deletes the current value of the textbox, then types the new value.

        Args:
            value: The new value to set for the textbox.
        """
        
        current_value = self.get_value()

        if current_value != value:
            length = len(current_value)
            self.__send_keys(length * Keys.BACKSPACE)
            self.__send_keys(value)