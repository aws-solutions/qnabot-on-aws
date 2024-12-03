######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import boto3
import json

class IamClient:
    """
    A Python class to interact with Amazon IAM using Boto3.
    This class provides various methods to perform operations on IAM.
    """

    def __init__(self, region: str) -> None:
        """
        Initializes the IamClient class.

        Args:
            region (str): The AWS region to connect to.
        Returns:
            None.
        Raises:
            None.
        """

        self.iam_client = boto3.client('iam', region_name=region)

    def create_role(self, role_name: str, trust_relationship: dict) -> dict:
        """
        Creates an IAM role.

        Args:
            role_name (str): The name of the role to create.
            trust_relationship (dict): The trust relationship for the role.
        Returns:
            dict: The response from the create_role API call.
        Raises:
            None.
        """

        return self.iam_client.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=trust_relationship
        )
    
    def attach_policy(self, policy_arn: str, role_name: str) -> dict:
        """
        Attaches an IAM policy to a role.

        Args:
            policy_arn (str): The ARN of the policy to attach.
            role_name (str): The name of the role to attach the policy to.
        Returns:
            dict: The response from the attach_policy API call.
        Raises:
            None.
        """

        return self.iam_client.attach_role_policy(
            PolicyArn=policy_arn,
            RoleName=role_name
        )
    
    def create_lexv2_role(self, bot_name) -> str:
        """
        Creates an Amazon Lex V2 role.

        Args:
            bot_name: The name of the bot.
        Returns:
            str: The name of the role.
        Raises:
            None.
        """
        role_name = f'lex_bot_role_{bot_name}'
        trust_relationship = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lexv2.amazonaws.com"
                        },
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        #  policy_arn = 'arn:aws:iam::aws:policy/aws-service-role/AmazonLexV2BotPolicy'

        self.delete_role_if_exists(role_name)

        response = self.create_role(role_name, json.dumps(trust_relationship))
        role_arn = response['Role']['Arn']

        # self.attach_policy(policy_arn, role_name)

        return role_arn
    
    def delete_role_if_exists(self, role_name: str) -> None:
        """
        Deletes an IAM role if it exists.

        Args:
            role_name (str): The name of the role to delete.
        Returns:
            None.
        Raises:
            None.
        """

        try:
            self.iam_client.delete_role(RoleName=role_name)
        except:
            pass