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
import json
import time

from botocore.exceptions import ClientError

class LexClient:
    """
    Class representing a Lex Bot Client.

    This class provides methods to interact with an AWS Lex bot, such as retrieving its properties
    and verifying the presence or absence of slot types.

    Attributes:
        lex_client (botocore.client.LexModelBuildingService): An instance of Boto3 Lex client.
    """

    def __init__(self, region: str) -> None:
        """
        Initializes the LexClient with a specific AWS region.

        Args:
            region (str): The AWS region to associate the Lex bot client.
        """

        self.lex_client = boto3.client('lexv2-models', region_name=region)

    def __get_bot_id_version(self, bot_name) -> tuple:
        """
        Private method to get the bot ID and latest version for a specific bot.

        Args:
            bot_name (str): The name of the bot.

        Returns:
            tuple: The bot ID and latest version of the bot.
        """

        response = self.lex_client.list_bots(
            filters=[
                {
                    'name': 'BotName',
                    'values': [
                        bot_name,
                    ],
                    'operator': 'EQ'
                },
            ],
        )
        while True:
            for bot_summary in response['botSummaries']:
                if bot_summary['botName'] == bot_name:
                    return bot_summary['botId'], bot_summary['latestBotVersion']
                
            if 'nextToken' in response:
                response = self.lex_client.list_bots(
                    nextToken=response['nextToken'],
                    filters=[
                        {
                            'name': 'BotName',
                            'values': [
                                bot_name,
                            ],
                            'operator': 'EQ'
                        },
                    ],
                )
            else:
                raise RuntimeError(f'Bot with name "{bot_name}" not found.')
    
    def __list_slot_type_names(self, id: str, version: str, locale: str) -> list[str]:
        """
        Private method to list the slot type names for a specific bot.

        Args:
            id (str): The ID of the bot.
            version (str): The version of the bot.
            locale (str): The locale for the bot.

        Returns:
            list[str]: The list of slot type names.
        """

        response = self.lex_client.list_slot_types(
            botId=id,
            botVersion=version,
            localeId=locale
        )

        return [slot_type['slotTypeName'] for slot_type in response['slotTypeSummaries']]
    
    def bot_slot_type_names_exist_for_all_locales(self, bot_name: str, slot_type_names: list[str], locales: list[str]=['en_US']) -> bool:
        """
        Checks if the specified slot type names exist for all the locales of a specific bot.

        Args:
            bot_name (str): The name of the bot.
            slot_type_names (list[str]): The list of slot type names to check.
            locales (list[str], optional): The list of locales to check. Defaults to ['en_US'].

        Returns:
            bool: True if all the slot type names exist for all locales, False otherwise.
        """

        bot_id, version = self.__get_bot_id_version(bot_name)

        return all([set(slot_type_names) <= set(self.__list_slot_type_names(bot_id, version, locale)) for locale in locales])

    def bot_slot_type_names_do_not_exist_for_all_locales(self, bot_name: str, slot_type_names: list[str], locales: list[str]=['en_US']) -> bool:
        """
        Checks if the specified slot type names do not exist for all the locales of a specific bot.

        Args:
            bot_name (str): The name of the bot.
            slot_type_names (list[str]): The list of slot type names to check.
            locales (list[str], optional): The list of locales to check. Defaults to ['en_US'].

        Returns:
            bool: True if none of the slot type names exist for all locales, False otherwise.
        """

        bot_id, version = self.__get_bot_id_version(bot_name)

        for locale in locales:
            if any(slot in slot_type_names for slot in self.__list_slot_type_names(bot_id, version, locale)):
                return False

        return True
    
    def create_test_bot(self, bot_name: str, role_arn: str, intent_files: list[str], locales: list[str]=['en_US']) -> str:
        """
        Creates a new bot with the specified slot type names for all the locales.

        Args:
            bot_name (str): The name of the bot.
            role_arn (str): The ARN of the IAM role that Amazon Lex uses to access the bot.
            locales (list[str], optional): The list of locales to create the bot for. Defaults to ['en_US'].
            intent_files (list[str]): The list of intent files to create the bot for.

        Raises:
            ClientError: If the create bot request fails.

        Returns:
            str: The bot id.
        """

        bot_id = self.create_bot(bot_name, role_arn)
        bot_version = 'DRAFT'

        self.create_bot_locales(bot_id, bot_version, locales)

        for intent_file in intent_files:
            intent = json.loads(open(intent_file).read())
            self.create_intent(bot_id, bot_version, intent=intent)

        self.build_bot_locales(bot_id, bot_version, locales)


    def create_bot(self, bot_name: str, role_arn: str) -> str:
        """
        Creates a new bot.

        Args:
            bot_name (str): The name of the bot.
            role_arn (str): The ARN of the IAM role that Amazon Lex uses to access the bot.

        Raises:
            ClientError: If the create bot request fails.

        Returns:
            str: The bot id.
        """

        self.delete_bot_if_exists(bot_name)

        try:
            resp = self.lex_client.create_bot(
                botName=bot_name,
                description='Bot for testing bot routing functionality',
                roleArn=role_arn,
                dataPrivacy={
                    'childDirected': False
                },
                idleSessionTTLInSeconds=300
            )

            self.lex_client.get_waiter('bot_available').wait(
                botId=resp['botId']
            )
            return resp['botId']

        except ClientError as e:
            raise e
    
    def create_bot_locales(self, bot_id: str, bot_version: str, locales: list[str]) -> None:
        """
        Creates the specified bot locales.

        Args:
            bot_id (str): The ID of the bot.
            bot_version (str): The version of the bot.
            locale (list[str]): The locales to create.
        """

        for locale in locales:
            self.lex_client.create_bot_locale(
                botId=bot_id,
                botVersion=bot_version,
                localeId=locale,
                nluIntentConfidenceThreshold=0.5,
            )

        for locale in locales:
            self.lex_client.get_waiter('bot_locale_created').wait(
                botId=bot_id,
                botVersion=bot_version,
                localeId=locale
            )
    
    def build_bot_locales(self, bot_id: str, bot_version: str, locales: list[str]) -> None:
        """
        Builds the specified bot locale.

        Args:
            bot_id (str): The ID of the bot.
            bot_version (str): The version of the bot.
            locale (list[str]): The locales to build the bot for.
        """

        for locale in locales:
            self.lex_client.build_bot_locale(
                botId=bot_id,
                botVersion=bot_version,
                localeId=locale
            )

        for locale in locales:
            self.lex_client.get_waiter('bot_locale_built').wait(
                botId=bot_id,
                botVersion=bot_version,
                localeId=locale
            )

    def delete_bot_if_exists(self, bot_name: str) -> None:
        """
        Deletes a specific bot if it exists.

        Args:
            bot_name (str): The name of the bot.
        """
        
        bot_id = self.find_bot_id_from_bot_name(bot_name)

        if bot_id:
            try:
                self.lex_client.delete_bot(botId=bot_id)
                # wait for bot to delete
                seconds_to_wait = 10
                elapsed_time = 0
                while self.find_bot_id_from_bot_name(bot_name) != '' and elapsed_time < seconds_to_wait:
                    elapsed_time += 1
                    if elapsed_time == seconds_to_wait:
                        raise RuntimeError('Bot did not delete in time')
                    else:
                        time.sleep(1)

            except ClientError:
                pass

    def create_intent(self, bot_id: str, bot_version: str, intent: dict) -> str:
        """
        Creates a new intent.

        Args:
            bot_id (str): The ID of the bot.
            intent_name (str): The name of the intent.
            locale (str): The locale of the intent.
            utterances (list[str]): The list of utterances for the intent.
            intent (dict): The intent object.

        """

        intent['botId'] = bot_id
        intent['botVersion'] = bot_version

        self.lex_client.create_intent(**intent)

    
    def find_bot_id_from_bot_name(self, bot_name: str) -> str:
        """
        Finds the bot id from the bot name.

        Args:
            bot_name (str): The name of the bot.

        Returns:
            str: The bot id.
        """

        bots = self.lex_client.list_bots(
            filters=[
                {
                    'name': 'BotName',
                    'values': [
                        bot_name,
                    ],
                    'operator': 'EQ'
                },
            ],
            # needs to be a large number to ensure all bots are returned - filter appears to filter the returned list not the full list
            maxResults=200,
        )['botSummaries']

        try:
            return bots[0]['botId']
        except IndexError:
            return ''
        
    def check_bot_exists(self, bot_name: str) -> bool:
        """
        Checks if the specified bot exists.

        Args:
            bot_name (str): The name of the bot.

        Returns:
            bool: True if the bot exists, False otherwise.
        """

        return self.find_bot_id_from_bot_name(bot_name) != ''