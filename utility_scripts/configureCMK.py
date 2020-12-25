import boto3
from botocore.config import Config
import argparse
import json
import base64
import sys


parser = argparse.ArgumentParser(description='Uses a specified CMK to encrypt QnABot Lambdas and Parameter Store settings')
parser.add_argument("region", help="AWS Region")
parser.add_argument("stack_arn", help="the arn of the QnABot CloudFormation Stack")
parser.add_argument("cmk_arn", help="the ARN of the Customer Master Key to use for encryption")
parser.add_argument("target_s3_bucket", help="the Name of the S3 bucket to use for server access logs")

args = type('', (), {})()

args = parser.parse_args()

client_config = Config(
    region_name = args.region
)

lambda_client = boto3.client('lambda', config=client_config)
iam_client = boto3.client('iam', config=client_config)
role_paginator = iam_client.get_paginator('list_role_policies')
kms_client = boto3.client("kms", config=client_config)
cloudformation_client = boto3.client('cloudformation', config=client_config)
ssm_client = boto3.client('ssm', config=client_config)
s3_client = boto3.client('s3', config=client_config)
ddb_client = boto3.client('dynamodb', config=client_config)
sts_client = boto3.client('sts', config=client_config)
kinesis_client = boto3.client('firehose', config=client_config)

policy_name = "CMKPolicy4"
policy_document = {
    "Version":"2012-10-17",
    "Statement":[
        {
            "Effect":"Allow",
            "Action":[
                "kms:Decrypt",
                "kms:Encrypt",
                "kms:GenerateDataKey"
            ],
            
            "Resource":args.cmk_arn
        }
    ]
}



cmk_roles_logical_ids = [
    'S3AccessRole',
    'FirehoseESS3Role',
    'AdminRole',
    'ExportRole',
    'ImportRole',
    'ApiGatewayRole',
    'ESCognitoRole',
    'KibanaRole',
]

cmk_roles_physical_ids = []

def assign_role(role_name):
    role_iterator = role_paginator.paginate(
        RoleName=role_name,
        PaginationConfig={
            'MaxItems': 1000,
            'PageSize': 1000
        }
    )

    print(f"Updating role {role_name}...")
    cmk_policy_exists = False
    for role in role_iterator:
        if policy_name in role["PolicyNames"]:
            cmk_policy_exists = True
            break

    if not cmk_policy_exists:
        iam_client.put_role_policy(RoleName=role_name, PolicyName = policy_name,PolicyDocument=json.dumps(policy_document))

def put_key_policy (stackname,roles):
    response = kms_client.get_key_policy(KeyId = args.cmk_arn, PolicyName='default')
    policy = response['Policy'].replace("\n","")
    policy = json.loads(policy)
    
    caller_identity = sts_client.get_caller_identity()

    new_statement = []
    for  statement in policy["Statement"]:
        if(statement["Sid"] != stackname):
            new_statement.append(statement)
    policy["Statement"] = new_statement

    formatted_roles = []
    for role in roles:
        formatted_roles.append(f"arn:aws:iam::{caller_identity['Account']}:role/{role}")

    policy["Statement"].append(

            {
                "Sid": stackname,
                "Effect": "Allow",
                "Principal": {
                    "AWS": formatted_roles
                },
                "Action": [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                "Resource": "*"
            }
        )

    print(f"Updating policy for key  {args.cmk_arn}")


    kms_client.put_key_policy(
        KeyId = args.cmk_arn,
        PolicyName = "default",
        Policy = json.dumps(policy)
    )

    print(f"Policy for key {args.cmk_arn} updated.")

def process_stacks(stackname):
    paginator = cloudformation_client.get_paginator('list_stack_resources')
    response_iterator = paginator.paginate(
        StackName=stackname,
        PaginationConfig={
            'MaxItems': 10000#,
        }
    )
    

    for response in response_iterator:
        lambda_resources = filter(lambda x: x["ResourceType"] == "AWS::Lambda::Function",response["StackResourceSummaries"])
        

        for lambda_func in lambda_resources:
            lambda_client.update_function_configuration(FunctionName=lambda_func["PhysicalResourceId"],KMSKeyArn=args.cmk_arn)
            print(f"Updated function {lambda_func['PhysicalResourceId']} in stack {stackname}")
            
            lambda_configuration = lambda_client.get_function_configuration(FunctionName=lambda_func["PhysicalResourceId"])
            role_name = lambda_configuration["Role"].split("/")[-1]

            assign_role(role_name)


        ssm_parameters = filter(lambda x: x["ResourceType"] == "AWS::SSM::Parameter",response["StackResourceSummaries"])

        for parameter in ssm_parameters:
            parameter_name = parameter["PhysicalResourceId"]
            parameter_response = ssm_client.get_parameter(
                Name=parameter_name,
                WithDecryption=True
            )
            parameter_value = parameter_response['Parameter']['Value']
            description = parameter_response['Parameter']["Description"] if "Decription" in parameter_response['Parameter'] else ""

            ssm_client.put_parameter(
                    Name=parameter_name,
                    Description=description,
                    Value=parameter_value,
                    Type='SecureString',
                    KeyId=args.cmk_arn,
                    Overwrite=True,
                )


        s3_buckets = filter(lambda x: x["ResourceType"] == "AWS::S3::Bucket",response["StackResourceSummaries"])
        for bucket in s3_buckets:
            s3_client.put_bucket_encryption(
                        Bucket=bucket["PhysicalResourceId"],
                        ServerSideEncryptionConfiguration={
                            'Rules': [
                                        {
                                            'ApplyServerSideEncryptionByDefault': {
                                                'SSEAlgorithm': 'aws:kms',
                                                'KMSMasterKeyID': args.cmk_arn
                                            }
                                        },
                                    ]
                                }
                            )
            print(f"Encryption set for {bucket['PhysicalResourceId']}")
            s3_client.put_bucket_logging(
                Bucket=bucket["PhysicalResourceId"],
                BucketLoggingStatus={
                    'LoggingEnabled': {
                        'TargetBucket': args.target_s3_bucket,
                        'TargetPrefix': bucket["PhysicalResourceId"] + '/'
                    }
                }
            )
            print(f"Access Logs set for {bucket['PhysicalResourceId']}")

        ddb_tables = filter(lambda x: x["ResourceType"] == "AWS::DynamoDB::Table",response["StackResourceSummaries"])
        for table in ddb_tables:
            table_description = ddb_client.describe_table(TableName = table["PhysicalResourceId"])
            if('SSEDescription' not in table_description["Table"] or 'KMSMasterKeyArn' not in table_description["Table"]['SSEDescription'] or  table_description["Table"]['SSEDescription']['KMSMasterKeyArn']!= args.cmk_arn ):
                ddb_client.update_table(
                    TableName = table["PhysicalResourceId"],
                    SSESpecification ={
                        'Enabled': True,
                        'SSEType': 'KMS',
                        'KMSMasterKeyId': args.cmk_arn
                    }
                )
                
        kinesis_streams = filter(lambda x: x["ResourceType"] == "AWS::KinesisFirehose::DeliveryStream",response["StackResourceSummaries"])
        for stream in kinesis_streams:
            stream_response = kinesis_client.describe_delivery_stream(
                        DeliveryStreamName=stream["PhysicalResourceId"])

            if('KeyType' not in stream_response['DeliveryStreamDescription']['DeliveryStreamEncryptionConfiguration'] 
                or ( stream_response['DeliveryStreamDescription']['DeliveryStreamEncryptionConfiguration']['KeyType']   != "CUSTOMER_MANAGED_CMK"  
                and  stream_response['DeliveryStreamDescription']['DeliveryStreamEncryptionConfiguration']['KeyARN'] != args.cmk_arn)):

                kinesis_client.start_delivery_stream_encryption(
                    DeliveryStreamName=stream["PhysicalResourceId"],
                    DeliveryStreamEncryptionConfigurationInput={
                        'KeyARN': args.cmk_arn,
                        'KeyType': 'CUSTOMER_MANAGED_CMK'})


        role_resources = filter(lambda x: 'LambdaRole' in x["LogicalResourceId"] or x["LogicalResourceId"] in cmk_roles_logical_ids , response["StackResourceSummaries"])
        for role_resource in role_resources:
            print(f"role_resource: {role_resource['PhysicalResourceId']}")
            cmk_roles_physical_ids.append(role_resource["PhysicalResourceId"])
            assign_role(role_resource["PhysicalResourceId"])



process_stacks(args.stack_arn)


paginator = cloudformation_client.get_paginator('list_stack_resources')
response_iterator = paginator.paginate(
    StackName=args.stack_arn,
    PaginationConfig={
        'MaxItems': 10000,
    }
)


for response in response_iterator:
    stacks = filter(lambda x: x["ResourceType"] == "AWS::CloudFormation::Stack",response["StackResourceSummaries"])
    for stack in stacks:
        print(f"Processing stack {stack['PhysicalResourceId']}")
        process_stacks(stack["PhysicalResourceId"])

put_key_policy(args.stack_arn,cmk_roles_physical_ids)

