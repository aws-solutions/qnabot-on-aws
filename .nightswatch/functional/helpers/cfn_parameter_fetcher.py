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

from typing import Optional
import boto3
import re

class ParameterFetcher:
    """
    A Python class to interact with AWS CloudFormation using Boto3.
    This class provides various methods to fetch details related to the specified stack.
    """

    def __init__(self, region: str, stack_name: str) -> None:
        """
        Constructs all the necessary attributes for the ParameterFetcher object.

        Parameters:
        ----------
            region : str
                AWS region name where the CloudFormation stack exists.
            stack_name : str
                The name of the CloudFormation stack.
        """
        self.region = region
        self.stack_name = stack_name
        self.cloudformation_client = boto3.client('cloudformation', region_name=region)

    def get_user_pool_id(self) -> Optional[str]:
        """
        Retrieves the User Pool ID from the stack resources.

        Returns:
        -------
            The User Pool ID if found, otherwise None.
        """
        response = self.cloudformation_client.list_stack_resources(
            StackName=self.stack_name
        )
        
        while True:
            for StackResourceSummary in response['StackResourceSummaries']:
                if StackResourceSummary['LogicalResourceId'] == 'UserPool':
                    user_pool_id = StackResourceSummary['PhysicalResourceId']
                    return user_pool_id
                
            if 'NextToken' in response:
                response = self.cloudformation_client.list_stack_resources(
                    StackName=self.stack_name,
                    NextToken=response['NextToken']
                )
            else:
                raise RuntimeError('User Pool ID not found.')
        

    def __get_cfn_param(self, key: str) -> Optional[str]:
        """
        Retrieves the key value from the stack parameters.

        Returns:
        -------
            The value if found, otherwise None.
        """
        response = self.cloudformation_client.describe_stacks(
            StackName=self.stack_name
        )
        stacks = response['Stacks']
        for stack in stacks:
            parameters = stack['Parameters']
            for parameter in parameters:
                if parameter['ParameterKey'] == key:
                    parameter_value = parameter['ParameterValue']
                    return parameter_value

    def __get_stack_description(self) -> Optional[str]:
        """
        Retrieves the stack description.

        Returns:
        -------
            The stack description.
        """
        response = self.cloudformation_client.describe_stacks(
            StackName=self.stack_name
        )
        return response['Stacks'][0]['Description']

    def __get_resource_name_from_logical_id(self, logical_id: str) -> Optional[str]:
        """
        Retrieves the resource name from the stack resources.

        Returns:
        -------
            The resource name if found.
        """
        response = self.cloudformation_client.describe_stack_resource(
            StackName=self.stack_name,
            LogicalResourceId=logical_id
        )
        return response['StackResourceDetail']['PhysicalResourceId']
    
    def __get_stack_outputs(self, key: str) -> Optional[str]:
        """
        Retrieves the stack outputs using the key provided.

        Returns: 
        -------
            The stack outputs.
        """
        describe_stack = self.cloudformation_client.describe_stacks(StackName=self.stack_name)
        stack_outputs = describe_stack['Stacks'][0]['Outputs']
        for output in stack_outputs:
            if output['OutputKey'] == key:
                return output['OutputValue']

    def get_kendra_index(self) -> Optional[str]:
        """
        Retrieves the Kendra Index from the stack parameters.

        Returns:
        -------
            The Kendra Index if found, otherwise None.
        """

        kendra_index_id = self.__get_cfn_param('DefaultKendraIndexId')
        return kendra_index_id

    def get_designer_client_id(self) -> Optional[str]:
        """
        Retrieves the Designer Client ID from the stack resources.

        Returns:
        -------
            The Designer Client ID if found, otherwise None.
        """
        response = self.cloudformation_client.list_stack_resources(
            StackName=self.stack_name
        )
        for StackResourceSummary in response['StackResourceSummaries']:
            if StackResourceSummary['LogicalResourceId'] == 'ClientDesigner':
                designer_client_id = StackResourceSummary['PhysicalResourceId']
                return designer_client_id

    def get_designer_url(self) -> Optional[str]:
        """
        Retrieves the Content Designer URL from the stack outputs.

        Returns:
        -------
            The Content Designer URL if found, otherwise None.
        """
        return self.__get_stack_outputs('ContentDesignerURL')

    def get_client_url(self) -> Optional[str]:
        """
        Retrieves the Client URL from the stack outputs.

        Returns:
        -------
            The Client URL if found, otherwise None.
        """
        return self.__get_stack_outputs('ClientURL')

    def kendra_is_enabled(self) -> bool:
        """
        Identifies if the Kendra is configured for the deployment.

        Returns:
        -------
            True if the kendra index is set.
        """
        kendra_index_id = self.get_kendra_index()
        return kendra_index_id != None and kendra_index_id != ''

    def llm_is_enabled(self) -> bool:
        """
        Identifies if an LLM is deployed.

        Returns:
        -------
            True if an LLM is configured.
        """
        llm_api_param = self.__get_cfn_param('LLMApi')
        return llm_api_param != None and llm_api_param != 'DISABLED'

    def embeddings_is_enabled(self) -> bool:
        """
        Identifies if embeddings is deployed.

        Returns:
        -------
            True if embeddings is configured.
        """
        embeddings_api_param = self.__get_cfn_param('EmbeddingsApi')
        return embeddings_api_param != None and embeddings_api_param != 'DISABLED'

    def get_fulfillment_lambda_name(self) -> str:
        """
        Retrieves the name of the fulfillment lambda.

        Returns:
        -------
            The name of the fulfillment lambda.
        """
        return self.__get_resource_name_from_logical_id('FulfillmentLambda')

    def get_deployment_version(self) -> str:
        """
        Retrieves the deployment version from the stack description.

        Returns:
        -------
            The deployment version.
        """
        description = self.__get_stack_description()
        version = re.search(r'Version v\s*([\d.]+)', description).group(1)
        return version

    def get_lambda_hook_example_arn(self) -> str:
        """
        Retrieves the ARN of the lambda hook example.

        Returns:
        -------
            The ARN of the lambda hook example.
        """
        examples_stack_name = self.__get_resource_name_from_logical_id('ExamplesStack')
        examples_stack_param_fetcher = ParameterFetcher(self.region, examples_stack_name) 
        return examples_stack_param_fetcher.__get_stack_outputs('EXTCustomJSHook')

