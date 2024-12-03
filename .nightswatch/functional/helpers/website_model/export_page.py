######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import time
from helpers.website_model.dom_operator import DomOperator
from helpers.utils.textbox import Textbox

FILENAME_ID = 'filename'
FILTER_ID = 'filter'
EXPORT_BUTTON_ID = 'export'

class ExportPage:
    """Class representing an ExportPage that allows the admin user to export questions.

    This class provides methods to set filename, filter and generate export for the questions.
    
    Attributes:
        operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
    """

    def __init__(self, operator: DomOperator) -> None:
        """
        Initializes ExportPage with a DomOperator instance.
        
        Args:
            operator (DomOperator): An instance of DomOperator to manipulate and interact with the DOM.
        """

        self.operator = operator

    def __set_filename(self, filename: str):
        """
        Private method to set the filename of the export file.
        
        Args:
            filename (str): The name of the export file.
        """

        filename_textbox = Textbox(self.operator.select_id(FILENAME_ID, click=True))
        filename_textbox.set_value(filename)

    def __set_filter(self, filter: str):
        """
        Private method to set the filter for the export operation.
        
        Args:
            filter (str): The filter for the export operation.
        """

        filter_textbox = Textbox(self.operator.select_id(FILTER_ID, click=False))
        filter_textbox.set_value(filter)

    def generate_export(self, filename: str, filter: str):
        """
        Generate an export file with the given filename and filter.

        Args:
            filename (str): The name of the export file.
            filter (str): The filter for the export operation.
        """

        self.__set_filename(filename)
        self.__set_filter(filter)
        self.operator.select_id(EXPORT_BUTTON_ID, click=True)

        self.operator.wait_for_element_by_xpath(f'//div[@id="export-job-{filename}" and @data-status="Started"]//i[contains( text( ),"file_download")]//ancestor::button')
        self.operator.wait_for_element_by_xpath(f'//div[@id="export-job-{filename}" and @data-status="Completed"]//i[contains( text( ),"file_download")]//ancestor::button')
        self.operator.select_xpath(f'//div[@id="export-job-{filename}" and @data-status="Completed"]//i[contains( text( ),"file_download")]//ancestor::button', click=True)
