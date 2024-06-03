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

import os

from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.firefox.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.common.exceptions import TimeoutException, NoSuchElementException

DOWNLOAD_DIR = f'../../{os.path.realpath(os.path.dirname(__file__))}/files'
HEADLESS_MODE_ENABLED = os.environ.get('HEADLESS_BROWSER') != 'false'

class DomOperator():
    """
    A singleton class to interact with the Document Object Model (DOM) of a webpage using Selenium.

    This class provides various methods for interacting with webpage elements,
    including selecting, checking existence, waiting for elements, and manipulating browser behavior.
    """

    def __new__(cls):
        """
        Implement the singleton pattern. If an instance of this class exists, it's returned.
        Otherwise, a new instance is created and returned.
        """
        if not hasattr(cls, 'instance'):
            cls.instance = super(DomOperator, cls).__new__(cls)
        return cls.instance
  
    def __init__(self) -> None:
        """
        Initialize the class with a Selenium webdriver with specific download preferences.
        """

        options = Options()

        if HEADLESS_MODE_ENABLED:
            options.add_argument("-headless")

        options.set_preference("browser.download.folderList", 2)
        options.set_preference("browser.download.manager.showWhenStarting", False)
        options.set_preference("browser.download.dir", DOWNLOAD_DIR)
        options.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/x-gzip")
        options.set_preference("devtools.console.stdout.content", True)
        
        service = Service(log_output="../test_browser_console.log")
        self.driver = webdriver.Firefox(options=options, service=service)
        self.driver.implicitly_wait(5)

    def get_url(self, url):
        """
        Navigate the webdriver to the provided URL.
        
        :param url: The URL to navigate to.
        """

        self.driver.get(url)

    def get_current_url(self) -> str:
        """
        Get the current URL that the webdriver is on.

        :return: The current URL as a string.
        """

        return self.driver.current_url

    def set_window_size(self, x, y):
        """
        Set the size of the browser window.

        :param x: The width of the window.
        :param y: The height of the window.
        """

        self.driver.set_window_size(x, y)
    
    def get_title(self) -> str:
        """
        Get the title of the current webpage.

        :return: The title of the current webpage as a string.
        """

        return self.driver.title

    def refresh_browser(self) -> None:
        """
        Refresh the current webpage.
        """
        self.driver.refresh()

    def element_exists_by_id(self, id, wait:int=5) -> bool:
        """
        Check if an element with the given ID exists in the webpage.

        :param id: The ID of the element.
        :return: True if the element exists, False otherwise.
        """

        try:
            WebDriverWait(self.driver, wait).until(EC.presence_of_element_located((By.ID, id)))
            return True
        except TimeoutException:
            print(f"Timeout exeception waiting for element with id {id} to appear")
            return False
        except NoSuchElementException:
            return False

    def element_exists_by_xpath(self, xpath, wait:int=3) -> bool:
        """
        Check if an element with the given XPath exists in the webpage.

        :param xpath: The XPath of the element.
        :return: True if the element exists, False otherwise.
        """

        try:
            WebDriverWait(self.driver, wait).until(EC.presence_of_element_located((By.XPATH, xpath)))
            return True
        except TimeoutException:
            print(f"Timeout exeception waiting for element with xpath {xpath} to appear")
            return False
        except NoSuchElementException:
            return False

    def select_id(self, id: str, wait:int=3, click:bool=False):
        """
        Select the element with the given ID and optionally click on it.

        :param id: The ID of the element.
        :param wait: The time in seconds to implicitly wait for the element.
        :param click: Whether to click the element or not.
        :return: The selected element.
        """
        try:
            element = self.driver.find_element(By.ID, id)
            if click:
                WebDriverWait(self.driver, wait).until(EC.element_to_be_clickable((By.ID, id)))
                self.driver.execute_script("arguments[0].click();", element)
            return element
        except NoSuchElementException as e:
            raise RuntimeError(f'Element with ID {id} not found.')

    def click_element_by_id(self, id: str, wait:int=0):
        """
        Click on the element with the given ID

        :param id: The ID of the element.
        :param wait: The time in seconds to implicitly wait for the element.
        """
        try:
            element = self.driver.find_element(By.ID, id)
            self.driver.execute_script("arguments[0].click();", element)
        except NoSuchElementException as e:
            raise RuntimeError(f'Element with ID {id} not found.')

    def select_css(self, css_selector: str, wait:int=0, click:bool=False):
        """
        Select the element with the given CSS selector and optionally click on it.

        :param css_selector: The CSS selector of the element.
        :param wait: The time to implicitly wait for the element.
        :param click: Whether to click the element or not.
        :return: The selected element.
        """

        try: 
            element = self.driver.find_element(By.CSS_SELECTOR, (css_selector))
            if click:
                element.click()
            return element
        except NoSuchElementException as e:
            raise RuntimeError(f'Element with CSS selector {css_selector} not found.')

    def select_name(self, name: str, wait:int=0, click:bool=False):
        """
        Select the element with the given name and optionally click on it.

        :param name: The name of the element.
        :param wait: The time to implicitly wait for the element.
        :param click: Whether to click the element or not.
        :return: The selected element.
        """
        try:
            element = self.driver.find_element(By.NAME, (name))
            if click:
                self.driver.execute_script("arguments[0].click();", element)
            return element
        except NoSuchElementException as e:
            raise RuntimeError(f'Element with name {name} not found.')

    def select_xpath(self, xpath: str, wait:int=0, click:bool=False):
        """
        Select the element with the given XPath and optionally click on it.

        :param xpath: The XPath of the element.
        :param wait: The time to implicitly wait for the element.
        :param click: Whether to click the element or not.
        :return: The selected element.
        """
        try: 
            element = self.driver.find_element(By.XPATH, xpath)
            if click:
                self.driver.execute_script("arguments[0].click();", element)
            return element
        except NoSuchElementException as e:
            raise RuntimeError(f'Element with XPath {xpath} not found.')
        
    def wait_for_element_attribute(self, id: str, attribute: str, value: str, delay: int = 10):
        """
        Wait for the element with the given ID to have the given attribute with the given value.

        :param id: The ID of the element.
        :param attribute: The name of the attribute.
        :param value: The value of the attribute.
        :param delay: The maximum time in seconds to wait for the element.
        :return: The element if it appears within the wait time, None otherwise.
        """

        try:
            return WebDriverWait(self.driver, delay).until(EC.text_to_be_present_in_element_attribute((By.ID, id), attribute, value))
        except TimeoutException:
            print(f'TimeoutException: element id: "{id}" waited {delay}s to load.')

    def wait_for_element_by_id(self, id: str, delay: int = 10):
        """
        Wait for the element with the given ID to be present in the webpage.

        :param id: The ID of the element.
        :param delay: The maximum time in seconds to wait for the element.
        :return: The element if it appears within the wait time, None otherwise.
        """

        try:
            return WebDriverWait(self.driver, delay).until(EC.presence_of_element_located((By.ID, id)))
        except TimeoutException:
            print(f'TimeoutException: element id: "{id}" waited {delay}s to load.')

    def wait_for_element_by_xpath(self, xpath: str, delay: int = 10):
        """
        Wait for the element with the given XPath to be present in the webpage.

        :param xpath: The XPath of the element.
        :param delay: The maximum time to wait for the element.
        :return: The element if it appears within the wait time, None otherwise.
        """

        try:
            return WebDriverWait(self.driver, delay).until(EC.presence_of_element_located((By.XPATH, xpath)))
        except TimeoutException:
            print(f'TimeoutException: element xpath: "{xpath}" waited {delay}s to load.')

    def wait_for_element_by_id_text(self, id: str, text: str, delay: int = 10):
        """
        Wait for the element with the given ID and text to be present in the webpage.

        :param id: The ID of the element.
        :param text: The text expected to be present in the element.
        :param delay: The maximum time to wait for the element.
        :return: True if the element with the expected text appears within the wait time, False otherwise.
        """

        try:
            return WebDriverWait(self.driver, delay).until(EC.text_to_be_present_in_element((By.ID, id), text))
        except TimeoutException:
            print(f'TimeoutException: element id "{id}" with text: "{text}" waited {delay}s to load.')

    def wait_for_element_by_xpath_text(self, xpath: str, text: str, delay: int = 10):
        """
        Wait for the element with the given xpath and text to be present in the webpage.

        :param xpath: The xpath of the element.
        :param text: The text expected to be present in the element.
        :param delay: The maximum time to wait for the element.
        :return: True if the element with the expected text appears within the wait time, False otherwise.
        """

        try:
            return WebDriverWait(self.driver, delay).until(EC.text_to_be_present_in_element((By.XPATH, xpath), text))
        except TimeoutException:
            print(f'TimeoutException: element id "{xpath}" with text: "{text}" waited {delay}s to load.')

    def switch_windows(self):
        """
        Switch to the next window handle if there is more than one window handle present.
        """

        if len(self.driver.window_handles) == 1:
            return

        original_window = self.driver.current_window_handle

        for window_handle in self.driver.window_handles:
            if window_handle != original_window:
                self.driver.switch_to.window(window_handle)
                break

    def end_session(self):
        """
        End the webdriver session.
        
        :return: The result of the webdriver's quit function.
        """

        return self.driver.quit()