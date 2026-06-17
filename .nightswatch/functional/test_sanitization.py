######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import json
import pytest
import requests
import boto3
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from botocore.credentials import Credentials
from conftest import get_password


class TestUnauthenticatedAccessDenied:
    """
    Negative tests verifying that unauthenticated users cannot create or modify Q&A responses.
    """

    @pytest.fixture
    def designer_url(self, param_fetcher) -> str:
        return param_fetcher.get_designer_url()

    def test_unauthenticated_user_cannot_create_question(self, designer_url: str):
        """
        Verifies that an unauthenticated user cannot create a Q&A item via the Content Designer API.
        An HTTP request without valid credentials should be rejected.
        """
        api_url = designer_url.replace('/static/index.html', '/api/questions')

        payload = {
            'qid': 'xss.test.unauth',
            'a': 'This should not be created.',
            'q': ['unauthenticated create test'],
            'type': 'qna',
        }

        response = requests.put(api_url, json=payload, headers={'Content-Type': 'application/json'})

        assert response.status_code in [401, 403], \
            f'Expected 401/403 for unauthenticated create, got {response.status_code}'

    def test_unauthenticated_user_cannot_modify_question(self, designer_url: str):
        """
        Verifies that an unauthenticated user cannot modify an existing Q&A item via the Content Designer API.
        An HTTP request without valid credentials should be rejected.
        """
        api_url = designer_url.replace('/static/index.html', '/api/questions/xss.test.unauth')

        payload = {
            'qid': 'xss.test.unauth',
            'a': '<img src=x onerror="alert(1)">',
            'q': ['unauthenticated modify test'],
            'type': 'qna',
        }

        response = requests.put(api_url, json=payload, headers={'Content-Type': 'application/json'})

        assert response.status_code in [401, 403], \
            f'Expected 401/403 for unauthenticated modify, got {response.status_code}'


class TestAuthenticatedNonAdminAccessDenied:
    """
    Negative tests verifying that an authenticated non-admin user cannot create or modify Q&A responses.
    """

    def _get_identity_pool_credentials(self, param_fetcher, id_token: str) -> Credentials:
        """Exchanges a Cognito ID token for IAM credentials via the Identity Pool."""
        region = param_fetcher.region
        user_pool_id = param_fetcher.get_user_pool_id()
        identity_pool_id = param_fetcher.get_identity_pool_id()
        login_key = f'cognito-idp.{region}.amazonaws.com/{user_pool_id}'

        cognito_identity = boto3.client('cognito-identity', region_name=region)
        identity_id = cognito_identity.get_id(
            IdentityPoolId=identity_pool_id,
            Logins={login_key: id_token},
        )['IdentityId']
        creds = cognito_identity.get_credentials_for_identity(
            IdentityId=identity_id,
            Logins={login_key: id_token},
        )['Credentials']
        return Credentials(
            access_key=creds['AccessKeyId'],
            secret_key=creds['SecretKey'],
            token=creds['SessionToken'],
        )

    def _make_signed_api_request(self, url: str, payload: dict, credentials: Credentials, region: str) -> requests.Response:
        """Makes a SigV4-signed PUT request to the IAM-authorized Content Designer API."""
        body = json.dumps(payload)
        aws_request = AWSRequest(method='PUT', url=url, data=body, headers={'Content-Type': 'application/json'})
        SigV4Auth(credentials, 'execute-api', region).add_auth(aws_request)
        return requests.put(url, data=body, headers=dict(aws_request.headers))

    @pytest.fixture
    def non_admin_auth_token(self, param_fetcher):
        """Creates a temporary non-admin Cognito user, authenticates to get an ID token, then cleans up."""
        region = param_fetcher.region
        user_pool_id = param_fetcher.get_user_pool_id()
        client_id = param_fetcher.get_designer_client_id()

        username = 'nonadmin-test-user'
        temp_password = get_password()
        new_password = get_password()

        cognito_idp = boto3.client('cognito-idp', region_name=region)

        try:
            cognito_idp.admin_create_user(
                UserPoolId=user_pool_id,
                Username=username,
                TemporaryPassword=temp_password,
                UserAttributes=[
                    {'Name': 'email', 'Value': 'nonadmin-test@example.com'},
                    {'Name': 'email_verified', 'Value': 'True'},
                ],
                ForceAliasCreation=True,
            )
            auth = cognito_idp.admin_initiate_auth(
                UserPoolId=user_pool_id,
                ClientId=client_id,
                AuthFlow='ADMIN_NO_SRP_AUTH',
                AuthParameters={'USERNAME': username, 'PASSWORD': temp_password},
            )
            cognito_idp.admin_respond_to_auth_challenge(
                UserPoolId=user_pool_id,
                ClientId=client_id,
                ChallengeName='NEW_PASSWORD_REQUIRED',
                ChallengeResponses={'USERNAME': username, 'NEW_PASSWORD': new_password},
                Session=auth['Session'],
            )
        except cognito_idp.exceptions.UsernameExistsException:
            cognito_idp.admin_set_user_password(
                UserPoolId=user_pool_id, Username=username, Password=new_password, Permanent=True,
            )

        auth = cognito_idp.admin_initiate_auth(
            UserPoolId=user_pool_id,
            ClientId=client_id,
            AuthFlow='ADMIN_NO_SRP_AUTH',
            AuthParameters={'USERNAME': username, 'PASSWORD': new_password},
        )
        id_token = auth['AuthenticationResult']['IdToken']

        yield {'id_token': id_token, 'region': region}

        cognito_idp.admin_delete_user(UserPoolId=user_pool_id, Username=username)

    @pytest.fixture
    def admin_auth_token(self, param_fetcher):
        """Authenticates the existing admin user and returns their ID token."""
        import os
        region = param_fetcher.region
        user_pool_id = param_fetcher.get_user_pool_id()
        client_id = param_fetcher.get_designer_client_id()

        cognito_idp = boto3.client('cognito-idp', region_name=region)
        auth = cognito_idp.admin_initiate_auth(
            UserPoolId=user_pool_id,
            ClientId=client_id,
            AuthFlow='ADMIN_NO_SRP_AUTH',
            AuthParameters={'USERNAME': os.environ.get('USER', 'QnaAdmin'), 'PASSWORD': os.environ.get('PASSWORD', '')},
        )
        yield {'id_token': auth['AuthenticationResult']['IdToken'], 'region': region}

    def test_authenticated_nonadmin_user_cannot_create_question(self, param_fetcher, non_admin_auth_token):
        """
        Verifies that an authenticated non-admin user cannot create a Q&A item.
        The Identity Pool denies IAM credentials to non-admin users (AmbiguousRoleResolution: Deny),
        so they cannot obtain the SigV4 credentials required to call any IAM-protected API.
        """
        with pytest.raises(boto3.client('cognito-identity', region_name=non_admin_auth_token['region']).exceptions.NotAuthorizedException):
            self._get_identity_pool_credentials(param_fetcher, non_admin_auth_token['id_token'])

    def test_authenticated_nonadmin_user_cannot_modify_question(self, param_fetcher, non_admin_auth_token):
        """
        Verifies that an authenticated non-admin user cannot modify an existing Q&A item.
        The Identity Pool denies IAM credentials to non-admin users (AmbiguousRoleResolution: Deny),
        so they cannot obtain the SigV4 credentials required to call any IAM-protected API.
        """
        with pytest.raises(boto3.client('cognito-identity', region_name=non_admin_auth_token['region']).exceptions.NotAuthorizedException):
            self._get_identity_pool_credentials(param_fetcher, non_admin_auth_token['id_token'])

    def test_admin_user_can_create_question(self, param_fetcher, admin_auth_token):
        """
        Positive control: verifies an admin can successfully create a Q&A item via the
        SigV4-signed API endpoint, confirming the endpoint is reachable and the negative
        tests above cannot pass for the wrong reason.
        """
        region = admin_auth_token['region']
        credentials = self._get_identity_pool_credentials(param_fetcher, admin_auth_token['id_token'])

        designer_url = param_fetcher.get_designer_url()
        api_url = designer_url.replace('/pages/designer', '/questions/positive.control.admin')
        payload = {'qid': 'positive.control.admin', 'a': 'Admin positive control.', 'q': ['admin create control'], 'type': 'qna'}

        response = self._make_signed_api_request(api_url, payload, credentials, region)
        assert response.status_code in (200, 201), \
            f'Expected admin create to succeed, got {response.status_code}'

        # Cleanup
        delete_request = AWSRequest(method='DELETE', url=api_url, headers={'Content-Type': 'application/json'})
        SigV4Auth(credentials, 'execute-api', region).add_auth(delete_request)
        requests.delete(api_url, headers=dict(delete_request.headers))
