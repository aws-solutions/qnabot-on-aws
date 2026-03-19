######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import boto3
from botocore.exceptions import ClientError
import time

class CognitoClient:
    """
    A Python class to interact with AWS Cognito using Boto3.
    This class provides various methods to manage users in a Cognito User Pool.
    """

    def __init__(self, region: str, user_pool_id: str, client_id: str) -> None:
        """
        Constructs all the necessary attributes for the CognitoClient object.

        Parameters:
        ----------
            region : str
                AWS region name where the Cognito User Pool exists.
            user_pool_id : str
                The ID of the Cognito User Pool.
            client_id : str
                The ID of the Cognito User Pool Client.
        """
        self.user_pool_id = user_pool_id
        self.client_id = client_id
        self.cognito_idp_client = boto3.client('cognito-idp', region_name=region)

    def create_admin_user(self, username: str, temporary_password: str, email: str) -> None:
        """
        Creates a new admin user if the user doesn't already exist in the Cognito User Pool.

        Parameters:
        ----------
            username : str
                The username for the new user.
            temporary_password : str
                The temporary password for the new user.
            email : str
                The email of the new user.
        """

        self.cognito_idp_client.admin_create_user(
            UserPoolId=self.user_pool_id,
            Username=username,
            UserAttributes=[
                {
                    'Name': 'email',
                    'Value': email
                },
                {
                    'Name': 'email_verified',
                    'Value': 'True'
                }
            ],
            TemporaryPassword=temporary_password,
            ForceAliasCreation=True
        )
        self.cognito_idp_client.admin_add_user_to_group(
            UserPoolId=self.user_pool_id,
            Username=username,
            GroupName='Admins'
        )

    def delete_admin_user(self, username: str) -> None:
        """
        Deletes an admin user from the Cognito User Pool.

        Parameters:
        ----------
            username : str
                The username of the user to delete.
        """

        self.cognito_idp_client.admin_delete_user(
            UserPoolId=self.user_pool_id,
            Username=username
        )

    def create_admin_and_set_password(self, username: str, temporary_password: str, new_password: str, email: str) -> int:
        """
        Creates a new admin user with the given username if the user doesn't already exist.

        Parameters:
        ----------
            username : str
                The username of the user.
            temporary_password : str
                The temporary password of the user.
            new_password : str
                The new password for the user.
            email : str
                The email of the user.

        Returns:
        -------
            The HTTP status code of the response to the AdminRespondToAuthChallenge request.
        """

        try: 
            self.create_admin_user(username, temporary_password, email)
            response_admin_initiate_auth = self.cognito_idp_client.admin_initiate_auth(
                UserPoolId=self.user_pool_id,
                ClientId=self.client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={
                    'USERNAME': username,
                    'PASSWORD': temporary_password
                }
            )
            session = response_admin_initiate_auth['Session']
            response_admin_respond_to_auth_challenge = self.cognito_idp_client.admin_respond_to_auth_challenge(
                UserPoolId=self.user_pool_id,
                ClientId=self.client_id,
                ChallengeName='NEW_PASSWORD_REQUIRED',
                ChallengeResponses={
                    'USERNAME': username,
                    'NEW_PASSWORD': new_password
                },
                Session=session
            )
            return response_admin_respond_to_auth_challenge['ResponseMetadata']['HTTPStatusCode']
        except ClientError as e:
            if e.response['Error']['Code'] == 'UsernameExistsException':
                print('User already exists')
                self.delete_admin_user(username)
                time.sleep(5) # Wait for 5 seconds before trying to create the user again.
                return self.create_admin_and_set_password(username, temporary_password, new_password, email)
            else:
                raise e
