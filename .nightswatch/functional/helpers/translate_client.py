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
import string

from botocore.exceptions import ClientError

class TranslateClient:
    """
    TranslateClient is a wrapper around the AWS Translate API.
    """
    def __init__(self, region: str) -> None:
        """
        Initializes the TranslateClient.

        :param region: The AWS region to use.
        """

        self.client = boto3.client('translate', region_name=region)

    def __remove_non_ascii(self, a_str: str) -> str:
        """
        Removed non-printable characters from string. Needed since QnABot performs this function as well.
        
        :param a_str: string to be cleaned
        :return: cleaned string
        
        """
        ascii_chars = set('\xa0')

        def replace_unprintable_chars_with_whitespace(char):
            if char in ascii_chars:
                return ' '
            return char

        return ''.join(
            map(replace_unprintable_chars_with_whitespace, a_str)
        )
    
    def list_terminologies(self) -> list[str]:
        """
        Lists all the terminologies.

        :return: A list of all the terminologies.
        """
        # will not return all terminologies for more than 100 results but this is more than enough for now
        response = self.client.list_terminologies(
            MaxResults=100
        )

        return [terminology['Name'] for terminology in response['TerminologyPropertiesList']]

    def has_terminology(self, name: str) -> bool:
        """
        Returns turns true if the terminology exists.

        :param name: The name of the terminology.
        :return: True if the terminology exists.
        """
        terminologies = self.list_terminologies()
        print(name)
        print(terminologies)

        return name in terminologies

    def delete_terminology(self, name: str):
        """
        Deletes provided terminology

        :param name: The terminology to delete.
        :return: None.
        """
        self.client.delete_terminology(
            Name=name
        )

    def delete_all_terminologies(self):
        """
        Deletes all the terminologies.

        :return: None.
        """

        terminologies = self.list_terminologies()
        for terminology in terminologies:
            self.delete_terminology(terminology)

    def translate(self, text: str, target_language: str) -> str:
        """
        :param text: The text to translate.
        :param target_language: The target language.
        :return: The translated text.
        """

        source_language = 'en'

        terminologies = self.list_terminologies()

        response = self.client.translate_text(
            Text=text,
            TerminologyNames=terminologies,
            SourceLanguageCode=source_language,
            TargetLanguageCode=target_language,
        )

        return self.__remove_non_ascii(response['TranslatedText'])


