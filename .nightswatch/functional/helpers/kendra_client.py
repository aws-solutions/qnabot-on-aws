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

import boto3

class KendraClient:
    """
    A Python class to interact with Amazon Kendra using Boto3.
    This class provides various methods to perform operations on Kendra.
    """

    def __init__(self, region: str, index: str) -> None:
        """
        Constructs all the necessary attributes for the KendraClient object.

        Parameters:
        ----------
            region : str
                AWS region name where the Kendra instance exists.
            index : str
                The index ID of Amazon Kendra.
        """
        self.index = index
        self.kendra_client = boto3.client('kendra', region_name=region)

    def list_faqs(self) -> dict:
        """
        Lists all FAQs for the given Amazon Kendra index.

        Returns:
        -------
            A dict containing the response from the ListFaqs operation.
        """
        return self.kendra_client.list_faqs(IndexId=self.index)

    def delete_faq_by_id(self, id: str) -> dict:
        """
        Deletes a specific FAQ based on its ID.

        Parameters:
        ----------
            id : str
                The ID of the FAQ to delete.

        Returns:
        -------
            A dict containing the response from the DeleteFaq operation.
        """
        return self.kendra_client.delete_faq(Id=id, IndexId=self.index)

    def list_data_sources(self) -> dict:
        """
        Lists all data sources for the given Amazon Kendra index.

        Returns:
        -------
            A dict containing the response from the ListDataSources operation.
        """
        return self.kendra_client.list_data_sources(IndexId=self.index)

    def query(self, query: str) -> dict:
        """
        Searches an index given an input query.

        Returns:
        -------
            A dict containing the response from the Query operation.
        """
        return self.kendra_client.query(IndexId=self.index, QueryText=query)
