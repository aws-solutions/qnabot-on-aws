######################################################################################################################
#  Copyright 2020-2021 Amazon.com, Inc. or its affiliates. All Rights Reserved.                                      #
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

import json
import os
import sys

root = os.environ["LAMBDA_TASK_ROOT"] + "/py_modules"
sys.path.insert(0, root)
import logging, uuid, requests
import boto3
from botocore.exceptions import ClientError
from copy import copy
from crhelper import CfnResource
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
helper = CfnResource(json_logging=True, log_level="INFO")
REQUST_TIMEOUT = 10  # in seconds


ssm_client = boto3.client('ssm')
dynamodb_client = boto3.client('dynamodb')
solution_parameter = os.environ["SOLUTION_PARAMETER"]
settings_table_name = os.environ["SETTINGS_TABLE"]

def get_parameter(parameter_name):
    try:
        response = ssm_client.get_parameter(
            Name=parameter_name,
            WithDecryption=True 
        )
        parameter_value = response['Parameter']['Value']
        print(f"Current value of {parameter_name}: {parameter_value}")
        return parameter_value
    except ClientError as e:
        message = e.response['Error']['Message']
        code = e.response['Error']['Code']
        logger.exception(f"Error while getting parameter {parameter_name}: {code}:{message}")
        raise e

def get_settings():
    settings = {}
    
    try:
        paginator = dynamodb_client.get_paginator('scan')
        pages = paginator.paginate(
            TableName=os.environ['SETTINGS_TABLE'],
            FilterExpression='SettingCategory <> :private AND SettingCategory <> :custom',
            ExpressionAttributeValues={
                ':private': {'S': 'private'},
                ':custom': {'S': 'custom'},
            }
        )

        items = []
        for page in pages:
            items.extend(page['Items'])
        
    except ClientError as error:
        print(f"Error: {error}")
        raise error

    for item in items:
        setting_name = item['SettingName']['S']
        setting_value = item['SettingValue'].get('S') or item['SettingValue'].get('N')
        default_value = item['DefaultValue'].get('S') or item['DefaultValue'].get('N')
        
        # Use setting_value if not empty, otherwise use default_value
        settings[setting_name] = setting_value if setting_value is not None else default_value
            
    return settings
    
def update_parameter(parameter_name, new_parameter_value):
    try:
        response = ssm_client.put_parameter(
            Name=parameter_name,
            Value=new_parameter_value,
            Type='SecureString', 
            Overwrite=True 
        )
        code = response['ResponseMetadata']['HTTPStatusCode']
        logger.info(f"Parameter updated with status {code}")
    except ClientError as e:
        message = e.response['Error']['Message']
        code = e.response['Error']['Code']
        logger.exception(f"Error while updating parameter {parameter_name}: {code}:{message}")
        raise e

def _sanitize_data(resource_properties):
    # Remove ServiceToken (lambda arn) to avoid sending AccountId
    resource_properties.pop("ServiceToken", None)
    resource_properties.pop("Resource", None)

    # Solution ID and unique ID are sent separately
    resource_properties.pop("SolutionId", None)
    resource_properties.pop("UUID", None)

    return resource_properties

def custom_map(settings):
    # Build a anonymized custom setting map
    c_map = {}
    if settings.get('BEDROCK_GUARDRAIL_IDENTIFIER') and settings.get('BEDROCK_GUARDRAIL_VERSION'):
        c_map['BEDROCK_GUARDRAIL_ENABLE'] = 'true'
    else:
        c_map['BEDROCK_GUARDRAIL_ENABLE'] = 'false'
        
    if settings.get('PREPROCESS_GUARDRAIL_IDENTIFIER') and settings.get('PREPROCESS_GUARDRAIL_VERSION'):
        c_map['PREPROCESS_GUARDRAIL_ENABLE'] = 'true'
    else:
        c_map['PREPROCESS_GUARDRAIL_ENABLE'] = 'false'
        
    if settings.get('POSTPROCESS_GUARDRAIL_IDENTIFIER') and settings.get('POSTPROCESS_GUARDRAIL_VERSION'):
        c_map['POSTPROCESS_GUARDRAIL_ENABLE'] = 'true'
    else:
        c_map['POSTPROCESS_GUARDRAIL_ENABLE'] = 'false'

    c_map['ENABLE_MULTI_LANGUAGE_SUPPORT'] = settings.get('ENABLE_MULTI_LANGUAGE_SUPPORT', 'false')
    c_map['LLM_GENERATE_QUERY_ENABLE'] = settings.get('LLM_GENERATE_QUERY_ENABLE', 'true')
    c_map['KNOWLEDGE_BASE_SEARCH_TYPE'] = settings.get('KNOWLEDGE_BASE_SEARCH_TYPE', 'DEFAULT')
    c_map['PII_REJECTION_ENABLED'] = settings.get('PII_REJECTION_ENABLED', 'false')
    c_map['EMBEDDINGS_ENABLE'] = settings.get('EMBEDDINGS_ENABLE', 'true')
    c_map['LLM_QA_ENABLE'] = settings.get('LLM_QA_ENABLE', 'true')
    c_map['FALLBACK_ORDER'] = settings.get('FALLBACK_ORDER', 'KNOWLEDGEBASE-FIRST')
    c_map['ENABLE_REDACTING'] = settings.get('ENABLE_REDACTING', 'false')
    c_map['ENABLE_REDACTING_WITH_COMPREHEND'] = settings.get('ENABLE_REDACTING_WITH_COMPREHEND', 'false')
    if settings.get('KNOWLEDGE_BASE_METADATA_FILTERS') and settings.get('KNOWLEDGE_BASE_METADATA_FILTERS') != "{}":
        c_map['KNOWLEDGE_BASE_METADATA_FILTERS_ENABLE'] = 'true'
    else:
        c_map['KNOWLEDGE_BASE_METADATA_FILTERS_ENABLE'] = 'false'

    return c_map

@helper.create
@helper.update
@helper.delete
def custom_resource(event, _):
    request_type = event["RequestType"]
    resource_properties = event["ResourceProperties"]
    resource = resource_properties["Resource"]

    if resource == "UUID":
        # Create a random UUID only when creating the stack. Do nothing otherwise.
        if request_type == "Create":
            random_id = str(uuid.uuid4())
            helper.Data.update({"UUID": random_id})
            update_parameter(solution_parameter, random_id)
    elif resource == "AnonymizedMetric":
        try:
            metrics_data = _sanitize_data(copy(resource_properties))
            metrics_data["RequestType"] = request_type

            solution_id = resource_properties["SolutionId"]
            solution_uuid = resource_properties["UUID"]
            update_parameter(solution_parameter, solution_uuid)
            send_metrics_request(metrics_data, solution_id, solution_uuid)

            # also send the settings as 'event': 'UPDATE_SETTINGS'
            try:
                custom_settings = get_settings()
                custom_data = custom_map(custom_settings)
                custom_data["event"]="UPDATE_SETTINGS"
                send_metrics_request(custom_data, solution_id, solution_uuid)
            except (ValueError, TypeError):
                print("Error parsing custom settings, skipping custom data sending.")
            
        except requests.exceptions.RequestException:
            logger.exception("Could not send usage data")
        except KeyError:
            logger.exception("One or more resource properties are missing")
    else:
        raise ValueError(f"Unknown resource: {resource}")

def send_metrics_request(metrics_data, solution_id, solution_uuid):
    headers = {"Content-Type": "application/json"}
    payload = {
                "Solution": solution_id.encode(),
                "UUID": solution_uuid.encode(),
                "TimeStamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f"),
                "Data": metrics_data,
            }

    logger.info(f"Sending payload: {payload}")
    response = requests.post(
                "https://metrics.awssolutionsbuilder.com/generic", json=payload, headers=headers, timeout=REQUST_TIMEOUT
            )
    logger.info(f"Response from metrics endpoint: {response.status_code} {response.reason}")


def handler(event, context):
    logger.info(f"Received event: {event}")
    if "ResourceProperties" in event:
        helper(event, context)
    else:
        if "event" in event:
            solution_id = os.environ["SOLUTION_ID"]
            solution_uuid = get_parameter(solution_parameter)
            send_metrics_request(event, solution_id, solution_uuid)