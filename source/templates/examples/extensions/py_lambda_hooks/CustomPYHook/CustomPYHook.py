######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

def handler(event, context):  # NOSONAR Lambda Handler
    event['res']['message']="Hi! This is your Custom Python Hook speaking!"
    return event

