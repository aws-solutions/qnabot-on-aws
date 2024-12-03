######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

# A client that connects with AWS CloudWatch and returns logs from log groups from a specific time period
import boto3
import time
import datetime

class CloudWatchClient:
    """
    Interacts with CloudWatch using Boto3.
    This class provides methods for pulling logs from log groups based on matches.
    """
    def __init__(self, region: str, stack_id: str, stack_name: str):
        """
        Initializes the CloudWatchClient.
        :param region: The AWS region to connect to.
        :type region: st
        """
        self.client = boto3.client('logs', region_name=region)
        self.region = region
        self.fulfillment_lambda_log_group = f'/aws/lambda/{stack_name}-FulfillmentLambda-{stack_id}'
        self.start_time = int(time.time() * 1000)

    def __get_logs(self, log_group_name: str, start_time: int, filter_pattern: str) -> dict:
        """
        Gets logs from a log group.
        :param log_group_name: The name of the log group.
        :param start_time: The start time of the logs.
        :param end_time: The end time of the logs.
        :return: The logs.
        :rtype: dict
        """

        response = self.client.filter_log_events(
            logGroupName=log_group_name,
            startTime=start_time,
            filterPattern=filter_pattern,
            limit=20
        )
        return response
    
    def print_logs(self, log_group_name: str, filter_pattern: str='') -> dict:
        """
        Prints logs from a given log group from the time of the start of the test to current.
        :param log_group_name: Log group name.
        :param filter_pattern: CloudWatch filter pattern.
        """
        # Wait for CloudWatch logs to be available
        time.sleep(10)

        print(f'----- Printing log group {log_group_name} from: {datetime.datetime.utcfromtimestamp(self.start_time/1000).strftime("%c")} to: {datetime.datetime.utcfromtimestamp(time.time()).strftime("%c")} -----')
        response = self.__get_logs(log_group_name, self.start_time, filter_pattern)
        for event in response['events']:
            print(event['message'])
    
    def print_fulfillment_lambda_logs(self, filter_pattern: str='?TypeError ?InvokeError ?"Invoke Error"') -> dict:
        """
        Prints logs from the fulfillment lambda function.
        :param filter_pattern: CloudWatch filter pattern.
        """
        self.print_logs(self.fulfillment_lambda_log_group, filter_pattern)