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
import sys

client = boto3.client('iam')

def delete_role():
    marker = None
    while True:
        paginator = client.get_paginator('list_roles')
        response_iterator = paginator.paginate(
            PaginationConfig={
                'PageSize': 10,
                'StartingToken': marker})
        for page in response_iterator:
            iam_roles = page['Roles']
            for iam_role in iam_roles:
                role_name = iam_role['RoleName']
                if role_name.startswith('AWSServiceRoleForLexV2Bots_tCaT-qnabot'):
                    client.delete_service_linked_role(RoleName=role_name)
                    print(role_name + '----DELETED')
        try:
            marker = page['Marker']
            print(marker)
        except KeyError:
            sys.exit()

delete_role()
