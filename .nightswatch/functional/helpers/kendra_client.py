######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import boto3

class KendraClient:
    """
    A Python class to interact with Amazon Kendra using Boto3.
    This class provides various methods to perform operations on Kendra.
    """

    def __init__(self, region: str, faq_index: str, webpage_index: str) -> None:
        """
        Constructs all the necessary attributes for the KendraClient object.

        Parameters:
        ----------
            region : str
                AWS region name where the Kendra instance exists.
            index : str
                The index ID of Amazon Kendra.
        """
        self.faq_index = faq_index
        self.webpage_index = webpage_index
        self.kendra_client = boto3.client('kendra', region_name=region)

    def list_faqs(self) -> dict:
        """
        Lists all FAQs for the given Amazon Kendra index.

        Returns:
        -------
            A dict containing the response from the ListFaqs operation.
        """
        return self.kendra_client.list_faqs(IndexId=self.faq_index)

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
        return self.kendra_client.delete_faq(Id=id, IndexId=self.faq_index)

    def list_data_sources(self) -> dict:
        """
        Lists all data sources for the given Amazon Kendra index.

        Returns:
        -------
            A dict containing the response from the ListDataSources operation.
        """
        return self.kendra_client.list_data_sources(IndexId=self.webpage_index)

    def query(self, query: str) -> dict:
        """
        Searches an index given an input query.

        Returns:
        -------
            A dict containing the response from the Query operation.
        """
        return self.kendra_client.query(IndexId=self.webpage_index, QueryText=query)
