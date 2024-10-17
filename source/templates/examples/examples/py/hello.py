######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import datetime


def handler(event, context):  # NOSONAR Lambda Handler
    current_time = datetime.datetime.now()

    if current_time.hour < 12:
        message='Good morning, '
    elif 12 <= current_time.hour < 18:
        message='Good afternoon, '
    else:
        message='Good evening, '
    event['res']['message']=message+event['res']['message']

    return event

