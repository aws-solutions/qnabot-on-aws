######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import os
import sys

root = os.environ["LAMBDA_TASK_ROOT"] + "/py_modules"
sys.path.insert(0, root)
import boto3, logging, botocore
logger = logging.getLogger(__name__)
from crhelper import CfnResource
from botocore.config import Config

sdk_config = Config(user_agent_extra = f"AWSSOLUTION/{os.environ['SOLUTION_ID']}/{os.environ['SOLUTION_VERSION']} AWSSOLUTION-CAPABILITY/{os.environ['SOLUTION_ID']}-C023/{os.environ['SOLUTION_VERSION']}")

helper = CfnResource(json_logging=True, log_level='INFO')

def delete_bucket_objects(event, _):
    '''
        This function will delete all the objects in the bucket. It's invoked by
        crhelper during the CloudFormation Delete operation. This function is also
        invoked by crhelper as it tries to poll for the deletion of S3 objects.
    '''
    resource_properties = event["ResourceProperties"]
    bucket = resource_properties["Bucket"]
    bucket_name = bucket.encode()

    s3_client = boto3.client('s3', config=sdk_config)

    prefix = None
    if "Prefix" in resource_properties:
        prefix = resource_properties["Prefix"]
    
    object_versions = None
    try:
        if prefix:
            object_versions = s3_client.list_object_versions(Bucket=bucket, Prefix=prefix)
        else:
            object_versions = s3_client.list_object_versions(Bucket=bucket)
        object_list = object_versions.get('Versions', []) + object_versions.get('DeleteMarkers', [])
    except botocore.exceptions.ClientError as err:
        if err.response['Error']['Code'] == 'NoSuchBucket':
            logger.info(f"Bucket {bucket_name} does not exist")
            return
        else:
            raise err

    if len(object_list) > 0:
        logger.info(f"There are {len(object_list)} objects to delete in {bucket_name}")
        
        s3_client.put_bucket_versioning(
            Bucket=f'{bucket}',
            VersioningConfiguration={
                'Status': 'Suspended'
            }
        )
        logger.info(f"Suspended bucket versioning in {bucket_name}")

        delete_objects_response = s3_client.delete_objects(
            Bucket=bucket,
            Delete={
                'Objects': [
                    {'Key': obj['Key'], 'VersionId': obj['VersionId']} for obj in object_list
                ],
            }
        )

        deleted_objects = delete_objects_response.get('Deleted', [])
        logger.info(f"Deleted {len(deleted_objects)} objects")

        # Extract the list of Errors from the response
        errors = delete_objects_response.get('Errors', [])
        if errors:
            raise RuntimeError(f"Error deleting objects: {errors}")
        
    else:
        logger.info(f"There are no objects to delete in {bucket_name}")
        return True

@helper.create
@helper.update
def no_op(_, __):
    pass # No action is required when stack is created or updated

@helper.delete
def delete_bucket(event, _):
    '''
        This function is invoked by crhelper as it deletes the S3 objects.
        See (https://github.com/aws-cloudformation/custom-resource-helper) for
        an explainer on why this function never returns anything
    '''
    delete_bucket_objects(event, _)

@helper.poll_delete
def poll_delete_bucket(event, _):
    '''
        This function is invoked by crhelper as it polls for the deletion of S3 objects
        See (https://github.com/aws-cloudformation/custom-resource-helper) for more info
        on why this function returns a value.
    '''
    return delete_bucket_objects(event, _)

def handler(event, context):
    helper(event, context)
