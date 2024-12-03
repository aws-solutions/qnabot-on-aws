######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

from aws_solutions.core.config import Config

config = Config()

from aws_solutions.core.helpers import ( 
    get_aws_region,
    get_aws_partition,
    get_service_client,
    get_service_resource,
    get_aws_account,
)
