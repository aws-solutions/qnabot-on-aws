import boto3
from botocore.config import Config
import argparse
import json
import base64
import sys

parser = argparse.ArgumentParser(
    description='Sets alerts for QnABot Lambdas and Elastic Search Cluster based on stack name')
parser.add_argument("region", help="AWS Region")
parser.add_argument("stack_arn", help="the Name of the QnABot CloudFormation Stack")
parser.add_argument("topic_arn", help="the arn of the topic to send alarms")

args = type('', (), {})()

args = parser.parse_args()

client_config = Config(
    region_name=args.region
)

lambda_client = boto3.client('lambda', config=client_config)
cloudformation_client = boto3.client('cloudformation', config=client_config)
cloudwatch = boto3.client('cloudwatch', config=client_config)

target_lambda_logical_ids = [
    'FulfillmentLambda',
    'ESQueryLambda'
]


def put_alarm_cluster(domainname, desc, metricname, treatmissingdata, topic):
    alarm = cloudwatch.put_metric_alarm(
        AlarmName='QnABotClusterStatus-' + desc + '-' + domainname,
        ComparisonOperator='GreaterThanThreshold',
        EvaluationPeriods=3,
        DatapointsToAlarm=3,
        MetricName=metricname,
        Namespace='AWS/ES',
        Period=300,
        Statistic='Average',
        Threshold=0,
        ActionsEnabled=True,
        AlarmActions=[topic],
        TreatMissingData=treatmissingdata,
        AlarmDescription='Alarm when server status exceeds 0',
        Dimensions=[
            {
                'Name': 'DomainName',
                'Value': domainname
            },
        ],
        Unit='Seconds'
    )


def put_alarm_lambda(functionname, desc, metricname, threshold, treatmissingdata, topic):
    alarm = cloudwatch.put_metric_alarm(
        AlarmName='QnABotLambda-' + desc + '-' + functionname,
        ComparisonOperator='GreaterThanThreshold',
        EvaluationPeriods=3,
        DatapointsToAlarm=3,
        MetricName=metricname,
        Namespace='AWS/Lambda',
        Period=300,
        Statistic='Average',
        Threshold=threshold,
        ActionsEnabled=True,
        AlarmActions=[topic],
        TreatMissingData=treatmissingdata,
        AlarmDescription='Alarm when server status exceeds 0',
        Dimensions=[
            {
                'Name': 'FunctionName',
                'Value': functionname
            },
        ],
        Unit='Seconds'
    )


def process_stacks(stackname):
    paginator = cloudformation_client.get_paginator('list_stack_resources')
    response_iterator = paginator.paginate(
        StackName=stackname,
        PaginationConfig={
            'MaxItems': 10000  # ,
        }
    )

    for response in response_iterator:

        escluster_resources = filter(lambda x: x["ResourceType"] == "AWS::Elasticsearch::Domain",
                                  response["StackResourceSummaries"])
        for cluster in escluster_resources:
            print(cluster["PhysicalResourceId"])
            put_alarm_cluster(cluster["PhysicalResourceId"], 'Red', 'ClusterStatus.red', 'notBreaching', args.topic_arn)
            put_alarm_cluster(cluster["PhysicalResourceId"], 'Yellow', 'ClusterStatus.yellow', 'notBreaching', args.topic_arn)

        lambda_resources = filter(lambda x: x["ResourceType"] == "AWS::Lambda::Function" and
                                            x["LogicalResourceId"] in target_lambda_logical_ids,
                                  response["StackResourceSummaries"])

        for lambda_func in lambda_resources:
            print(lambda_func["PhysicalResourceId"])
            put_alarm_lambda(lambda_func["PhysicalResourceId"], 'Throttles', 'Throttles', 10, 'notBreaching', args.topic_arn)
            put_alarm_lambda(lambda_func["PhysicalResourceId"], 'Errors', 'Errors', 5, 'notBreaching', args.topic_arn)


process_stacks(args.stack_arn)

paginator = cloudformation_client.get_paginator('list_stack_resources')
response_iterator = paginator.paginate(
    StackName=args.stack_arn,
    PaginationConfig={
        'MaxItems': 10000,
    }
)

for response in response_iterator:
    stacks = filter(lambda x: x["ResourceType"] == "AWS::CloudFormation::Stack", response["StackResourceSummaries"])
    for stack in stacks:
        print(f"Processing stack {stack['PhysicalResourceId']}")
        process_stacks(stack["PhysicalResourceId"])
