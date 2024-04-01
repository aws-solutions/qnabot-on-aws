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

#!/usr/bin/env python3

# Deletes S3 buckets created by stack deployment

import boto3
import logging
import os
import time

from botocore.exceptions import ClientError

profile_name = os.environ.get('TEST_ACCOUNT_PROFILE_NAMES')
boto3.setup_default_session(profile_name=profile_name)

s3 = boto3.resource("s3")

bucket_name = ["tcat-qnabot"]
print("buckets to be delete should starts with:")
print(bucket_name)

def delete_bucket():
    for buckets in bucket_name:
        try:
            for bucket in s3.buckets.all():
                if bucket.name.startswith(buckets):
                    print("the bucket exists!!------" + bucket.name)
                    s3_bucket = s3.Bucket(bucket.name)
                    s3_object = s3_bucket.object_versions.delete()
                    s3_bucket.objects.all().delete()
                    s3_bucket.delete()
                    print("bucket deleted:" + "----" + bucket.name)
                    time.sleep(5)
        except ClientError as e:
            logging.error(e)
            return


delete_bucket()
