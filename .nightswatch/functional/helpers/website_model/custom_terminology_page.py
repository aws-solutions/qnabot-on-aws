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

UPLOAD_FILE_ID = 'upload-file'

class CustomTerminologyPage:
    """
    Class to represent a Custom Terminology page on a website.

    This class uses a DomOperator object to interact with the webpage.
    It includes functionality to upload a file which contains custom terminology that should not be translated into different languages.

    :param operator: The DomOperator object to operate on the webpage.
    """
    
    def __init__(self, operator: DomOperator) -> None:
        """
        Initialize CustomTerminologyPage with a DomOperator object.
        
        :param operator: The DomOperator object to operate on the webpage.
        """

        self.operator = operator

    def upload_file(self, file):
        """
        Upload a file to the Custom Terminology page.
        
        :param file: The path to the file to be uploaded.
        """

        self.operator.select_id(UPLOAD_FILE_ID).send_keys(file)