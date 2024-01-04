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

from helpers.utils.textbox import Textbox
from helpers.website_model.dom_operator import DomOperator

EMPTY_MESSAGE_LABEL = 'EMPTYMESSAGE'
MULTI_LANGUAGE_SUPPORT_LABEL = 'ENABLE_MULTI_LANGUAGE_SUPPORT'
ENABLE_KENDRA_LABEL = 'ENABLE_KENDRA_WEB_INDEXER'
ENABLE_KENDRA_FALLBACK_LABEL = 'KENDRA_FAQ_ES_FALLBACK'
KENDRA_INDEX_LABEL = 'KENDRA_INDEXER_URLS'
ENABLE_EMBEDDINGS_LABEL = 'EMBEDDINGS_ENABLE'
ENABLE_CUSTOM_TERMINOLOGY_LABEL = 'ENABLE_CUSTOM_TERMINOLOGY'
ENABLE_FILTER_LABEL = 'ES_USE_KEYWORD_FILTERS'
FILTER_CRITERIA_LABEL = 'ES_MINIMUM_SHOULD_MATCH'
KENDRA_INDEXER_CRAWL_DEPTH_LABEL = 'KENDRA_INDEXER_CRAWL_DEPTH'
KENDRA_INDEXER_MODE_LABEL = 'KENDRA_INDEXER_CRAWL_MODE'
KENDRA_INDEXER_SCHEDULE_LABEL = 'KENDRA_INDEXER_SCHEDULE'
KENDRA_MAX_DOCUMENT_COUNT = 'ALT_SEARCH_KENDRA_MAX_DOCUMENT_COUNT'

ENABLE_DEBUG_RESPONSES_LABEL = 'ENABLE_DEBUG_RESPONSES'
ES_SCORE_TEXT_ITEM_PASSAGES_LABEL = 'ES_SCORE_TEXT_ITEM_PASSAGES'
LLM_GENERATE_QUERY_ENABLE_LABEL = 'LLM_GENERATE_QUERY_ENABLE'
LLM_QA_ENABLE_LABEL = 'LLM_QA_ENABLE'
LLM_QA_USE_KENDRA_RETRIEVAL_API_LABEL = 'LLM_QA_USE_KENDRA_RETRIEVAL_API'
LLM_QA_SHOW_CONTEXT_TEXT_LABEL = 'LLM_QA_SHOW_CONTEXT_TEXT'
LLM_QA_SHOW_SOURCE_LINKS_LABEL = 'LLM_QA_SHOW_SOURCE_LINKS'

PRE_PROCESSING_LAMBDA_LABEL = 'LAMBDA_PREPROCESS_HOOK'
POST_PROCESSING_LAMBDA_LABEL = 'LAMBDA_POSTPROCESS_HOOK'

SAVE_XPATH = "//button[span='Save']"
RESET_XPATH = "//button[span='Reset to defaults']"
SAVE_STATUS_CSS = '#error-modal'
SAVE_MODAL_CLOSE_XPATH = "//button[span='close']"

class SettingsPage:
    """
    Class representing a Settings Page.

    This class provides methods to interact with and manipulate the settings of Q&A bot.

    Attributes:
        operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
    """

    def __init__(self, operator: DomOperator) -> None:
        """
        Initializes the SettingsPage with a DomOperator instance.

        Args:
            operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
        """

        self.operator = operator

    def save_settings(self) -> str:
        """Saves the current settings and returns the status of the operation."""

        self.operator.select_xpath(SAVE_XPATH, click=True)
        self.operator.wait_for_element_by_xpath(SAVE_MODAL_CLOSE_XPATH)
        time.sleep(1)

        status = self.operator.select_css(SAVE_STATUS_CSS).text
        self.operator.select_xpath(SAVE_MODAL_CLOSE_XPATH, click=True)

        return status

    def reset_settings(self) -> str:
        """Resets the current settings."""

        self.operator.select_xpath(RESET_XPATH, click=True)
        time.sleep(1)

    def select_setting_by_label(self, label: str):
        """
        Selects a setting by its label.

        Args:
            label (str): The label of the setting to select.

        Returns:
            The selected WebElement.
        """

        return self.operator.select_id(label, click=False)
    
    def __set_element_value(self, element, value):
        """
        Private method to set the value of a WebElement.

        Args:
            element: The WebElement to update.
            value: The value to set in the WebElement.
        """

        textbox = Textbox(element)
        textbox.set_value(value)
    
    def __get_element_value(self, element) -> str:
        """
        Private method to get the value of a WebElement.

        Args:
            element: The WebElement to update.
        Returns:
            The value of the WebElement.
        """

        textbox = Textbox(element)
        return textbox.get_value()

    def customize_empty_message(self, message) -> str:
        """
        Customizes the empty message setting and saves the changes.

        Args:
            message (str): The new empty message.

        Returns:
            The status of the save operation.
        """

        customize_empty_message = self.select_setting_by_label(EMPTY_MESSAGE_LABEL)
        self.__set_element_value(customize_empty_message, message)
        return self.save_settings()

    def enable_multi_language_support(self) -> str:
        """
        Enables the multi-language support setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        enable_multi_language_support = self.select_setting_by_label(MULTI_LANGUAGE_SUPPORT_LABEL)
        self.__set_element_value(enable_multi_language_support, 'true')
        return self.save_settings()

    def enable_kendra(self, indexer_url: str, depth: int=2, mode: str='subdomains', schedule: str='rate(1 day)', doc_count: str='10') -> str:
        """
        Enables the Kendra setting and configures Kendra parameters.

        Args:
            indexer_url (str): The URL of the indexer.
            depth (int, optional): The crawl depth. Defaults to 3.
            mode (str, optional): The indexing mode. Defaults to 'subdomains'.
            schedule (str, optional): The indexing schedule. Defaults to 'rate(1 day)'.
            doc_count (str, optional): The number of docs returned by Kendra. Defaults to '10'.

        Returns:
            The status of the save operation.
        """

        enable_kendra_web_indexer = self.select_setting_by_label(ENABLE_KENDRA_LABEL)
        self.__set_element_value(enable_kendra_web_indexer, 'true')

        update_kendra_indexer_urls = self.select_setting_by_label(KENDRA_INDEX_LABEL)
        self.__set_element_value(update_kendra_indexer_urls, indexer_url)

        update_kendra_indexer_crawl_depth = self.select_setting_by_label(KENDRA_INDEXER_CRAWL_DEPTH_LABEL)
        self.__set_element_value(update_kendra_indexer_crawl_depth, depth)

        update_kendra_indexer_mode = self.select_setting_by_label(KENDRA_INDEXER_MODE_LABEL)
        self.__set_element_value(update_kendra_indexer_mode, mode)

        update_kendra_indexer_schedule = self.select_setting_by_label(KENDRA_INDEXER_SCHEDULE_LABEL)
        self.__set_element_value(update_kendra_indexer_schedule, schedule)

        update_kendra_doc_count = self.select_setting_by_label(KENDRA_MAX_DOCUMENT_COUNT)
        self.__set_element_value(update_kendra_doc_count, doc_count)

        return self.save_settings()

    def enable_kendra_fallback(self) -> str:
        """
        Enables the Kendra fallback setting.

        Returns:
            The status of the save operation.
        """

        enable_kendra_web_indexer = self.select_setting_by_label(ENABLE_KENDRA_FALLBACK_LABEL)
        self.__set_element_value(enable_kendra_web_indexer, 'true')

        return self.save_settings()

    def disable_kendra_fallback(self) -> str:
        """
        Disables the Kendra fallback setting.

        Returns:
            The status of the save operation.
        """

        enable_kendra_web_indexer = self.select_setting_by_label(ENABLE_KENDRA_FALLBACK_LABEL)
        self.__set_element_value(enable_kendra_web_indexer, 'false')

        return self.save_settings()

    def enable_embeddings(self) -> str:
        """
        Enables the embeddings setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        enable_embeddings = self.select_setting_by_label(ENABLE_EMBEDDINGS_LABEL)
        self.__set_element_value(enable_embeddings, 'true')
        return self.save_settings()

    def disable_embeddings(self) -> str:
        """
        Disables the embeddings setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        disable_embeddings = self.select_setting_by_label(ENABLE_EMBEDDINGS_LABEL)
        self.__set_element_value(disable_embeddings, 'false')
        return self.save_settings()

    def enable_llm(self) -> str:
        """
        Enables LLM setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        enable_debug = self.select_setting_by_label(ENABLE_DEBUG_RESPONSES_LABEL)
        self.__set_element_value(enable_debug, 'true')

        enable_item_passages = self.select_setting_by_label(ES_SCORE_TEXT_ITEM_PASSAGES_LABEL)
        self.__set_element_value(enable_item_passages, 'true')

        enable_generative_query = self.select_setting_by_label(LLM_GENERATE_QUERY_ENABLE_LABEL)
        self.__set_element_value(enable_generative_query, 'true')

        enable_llm_qa = self.select_setting_by_label(LLM_QA_ENABLE_LABEL)
        self.__set_element_value(enable_llm_qa, 'true')

        enable_llm_kendra = self.select_setting_by_label(LLM_QA_USE_KENDRA_RETRIEVAL_API_LABEL)
        self.__set_element_value(enable_llm_kendra, 'true')

        enable_show_context_text = self.select_setting_by_label(LLM_QA_SHOW_CONTEXT_TEXT_LABEL)
        self.__set_element_value(enable_show_context_text, 'true')

        enable_source_links = self.select_setting_by_label(LLM_QA_SHOW_SOURCE_LINKS_LABEL)
        self.__set_element_value(enable_source_links, 'true')

        return self.save_settings()

    def disable_llm(self) -> str:
        """
        Disables LLM setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        enable_item_passages = self.select_setting_by_label(ES_SCORE_TEXT_ITEM_PASSAGES_LABEL)
        self.__set_element_value(enable_item_passages, 'false')

        enable_generative_query = self.select_setting_by_label(LLM_GENERATE_QUERY_ENABLE_LABEL)
        self.__set_element_value(enable_generative_query, 'false')

        enable_llm_qa = self.select_setting_by_label(LLM_QA_ENABLE_LABEL)
        self.__set_element_value(enable_llm_qa, 'false')

        enable_llm_kendra = self.select_setting_by_label(LLM_QA_USE_KENDRA_RETRIEVAL_API_LABEL)
        self.__set_element_value(enable_llm_kendra, 'false')

        enable_show_context_text = self.select_setting_by_label(LLM_QA_SHOW_CONTEXT_TEXT_LABEL)
        self.__set_element_value(enable_show_context_text, 'false')

        enable_source_links = self.select_setting_by_label(LLM_QA_SHOW_SOURCE_LINKS_LABEL)
        self.__set_element_value(enable_source_links, 'false')

        return self.save_settings()

    def disable_llm_disambiguation(self):
        enable_generative_query = self.select_setting_by_label(LLM_GENERATE_QUERY_ENABLE_LABEL)
        self.__set_element_value(enable_generative_query, 'false')

        return self.save_settings()

    def enable_custom_terminology(self) -> str:
        """
        Enables the custom terminology setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        enable_custom_terminology = self.select_setting_by_label(ENABLE_CUSTOM_TERMINOLOGY_LABEL)
        self.__set_element_value(enable_custom_terminology, 'true')
        return self.save_settings()

    def enable_filter(self) -> str:
        """
        Enables the filter setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        enable_filter = self.select_setting_by_label(ENABLE_FILTER_LABEL)
        self.__set_element_value(enable_filter, 'true')
        return self.save_settings()

    def disable_filter(self) -> str:
        """
        Disables the filter setting and saves the changes.

        Returns:
            The status of the save operation.
        """

        disable_filter = self.select_setting_by_label(ENABLE_FILTER_LABEL)
        self.__set_element_value(disable_filter, 'false')
        return self.save_settings()

    def set_match_criteria(self, criteria: str) -> str:
        """
        Sets the match criteria setting and saves the changes.

        Args:
            criteria (str): The match criteria to set.

        Returns:
            The status of the save operation.
        """

        match_criteria = self.select_setting_by_label(FILTER_CRITERIA_LABEL)
        self.__set_element_value(match_criteria, criteria)
        return self.save_settings()

    def get_no_hits_response(self) -> str:
        """
        Returns the no hits response from the settings page.

        Returns:
            The no hits response from the settings page.
        """

        ho_hits = self.select_setting_by_label(EMPTY_MESSAGE_LABEL)
        return self.__get_element_value(ho_hits)

    def set_pre_processing_lambda(self, l: str) -> str:
        """
        Sets the pre-processing lambda setting and saves the changes.

        Args:
            l (str): The lambda function to set.

        Returns:
            The status of the save operation.
        """

        pre_processing_lambda = self.select_setting_by_label(PRE_PROCESSING_LAMBDA_LABEL)
        self.__set_element_value(pre_processing_lambda, l)
        return self.save_settings()


    def set_post_processing_lambda(self, l: str) -> str:
        """
        Sets the post-processing lambda setting and saves the changes.

        Args:
            l (str): The lambda function to set.

        Returns:
            The status of the save operation.
        """

        post_processing_lambda = self.select_setting_by_label(POST_PROCESSING_LAMBDA_LABEL)
        self.__set_element_value(post_processing_lambda, l)
        return self.save_settings()


