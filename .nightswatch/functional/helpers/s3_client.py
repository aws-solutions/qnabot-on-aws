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

class S3Client:
    """
    A Python class to interact with Amazon S3 using Boto3.
    This class provides various methods to perform operations on S3.
    """

    def __init__(self, region: str) -> None:
        """
        Initializes the S3Client class.

        Args:
            region (str): The AWS region to connect to.
        Returns:
            None.
        Raises:
            None.
        """

        self.s3_client = boto3.client('s3', region_name=region)

    def get_file_versions_count(self, bucket_name, file_prefix):
        """
        Returns the number of versions for a given file in an S3 bucket.
        
        Args:
        bucket_name (str) name of the bucket. 
        file_key (str) name of the file in the bucket.
            
        Returns:
            int: The number of versions for the specified file.
        """

        # Get the list of object versions for the specified file
        versions = self.s3_client.list_object_versions(Bucket=bucket_name, Prefix=file_prefix)
        # Count the number of versions
        version_count = 0
        if 'Versions' in versions:
            version_count = len(versions['Versions'])
        
        return version_count