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
import os

profile_name = os.environ.get('TEST_ACCOUNT_PROFILE_NAMES')
boto3.setup_default_session(profile_name=profile_name)

cloudformation_client = boto3.client('cloudformation', region_name=region)
cognito_idp_client = boto3.client('cognito-idp', region_name=region)


def get_user_pool_id():
    response = cloudformation_client.list_stack_resources(
        StackName=stack_name
    )
    response_more = cloudformation_client.list_stack_resources(
        StackName=stack_name,
        NextToken=response['NextToken']
    )
    for StackResourceSummary in response_more['StackResourceSummaries']:
        if StackResourceSummary['LogicalResourceId'] == 'UserPool':
            user_pool_id = StackResourceSummary['PhysicalResourceId']
            return user_pool_id


def get_original_admin_user():
    response = cloudformation_client.describe_stacks(
        StackName=stack_name
    )
    stacks = response['Stacks']
    for stack in stacks:
        parameters = stack['Parameters']
        for parameter in parameters:
            if parameter['ParameterKey'] == 'Username':
                original_admin_user = parameter['ParameterValue']
                return original_admin_user


def delete_admin_users():
    original_admin_user = get_original_admin_user()
    user_pool_id = get_user_pool_id()
    response = cognito_idp_client.list_users_in_group(
        UserPoolId=user_pool_id,
        GroupName='Admins'
    )
    for user in response['Users']:
        if user['Username'] != original_admin_user:
            adminusername = user['Username']
            print(adminusername)
            print('deleting this user')
            cognito_idp_client.admin_delete_user(
                UserPoolId=user_pool_id,
                Username=adminusername
            )


delete_admin_users()
