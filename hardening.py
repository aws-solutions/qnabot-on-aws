import boto3
import argparse
import json
import base64


parser = argparse.ArgumentParser(description='Uses a specified CMK to encrypt QnABot Lambdas and Parameter Store settings')
parser.add_argument("stack_arn", help="the arn of the QnABot CloudFormation Stack")
parser.add_argument("cmk_arn", help="the ARN of the Customer Master Key to use for encryption")

lambda_client = boto3.client('lambda')
iam_client = boto3.client('iam')
kms_client = boto3.client("kms")
cloudformation_client = boto3.client('cloudformation')
ssm_client = boto3.client('ssm')
s3_client = boto3.client('s3')

args = type('', (), {})()

if __name__ != "__main__":
    args = parser.parse_args()
else:
    args.stack_arn = 'QNA-dev-dev-master-4'
    args.cmk_arn = "arn:aws:kms:us-east-1:471804106294:key/71bd2c26-b9f8-4953-9dbe-fbcfe8bd5573"

policy_document = {
    "Version":"2012-10-17",
    "Statement":[
        {
            "Effect":"Allow",
            "Action":"kms:Decrypt",
            
            "Resource":args.cmk_arn
        }
    ]
}


def process_stacks(stackname):
    paginator = cloudformation_client.get_paginator('list_stack_resources')
    response_iterator = paginator.paginate(
        StackName=stackname,
        PaginationConfig={
            'MaxItems': 10000#,
        }
    )

    role_paginator = iam_client.get_paginator('list_role_policies')

    for response in response_iterator:
        lambda_resources = filter(lambda x: x["ResourceType"] == "AWS::Lambda::Function",response["StackResourceSummaries"])
        

        for lambda_func in lambda_resources:
            lambda_client.update_function_configuration(FunctionName=lambda_func["PhysicalResourceId"],KMSKeyArn=args.cmk_arn)
            print(f"Updated function {lambda_func} in stack {stackname}")
            
            lambda_configuration = lambda_client.get_function_configuration(FunctionName=lambda_func["PhysicalResourceId"])
            role_name = lambda_configuration["Role"].split("/")[-1]

            role_iterator = role_paginator.paginate(
                RoleName=role_name,
                PaginationConfig={
                    'MaxItems': 1000,
                    'PageSize': 1000
                }
            )

            cmk_policy_exists = False
            for role in role_iterator:
                if "CMKPolicy" in role["PolicyNames"]:
                    cmk_policy_exists = True
                    break

            if not cmk_policy_exists:
                iam_client.put_role_policy(RoleName=role_name, PolicyName = "CMKPolicy",PolicyDocument=json.dumps(policy_document))

        ssm_parameters = filter(lambda x: x["ResourceType"] == "AWS::SSM::Parameter",response["StackResourceSummaries"])

        for parameter in ssm_parameters:
            parameter_name = parameter["PhysicalResourceId"]
            parameter_response = ssm_client.get_parameter(
                Name=parameter_name,
                WithDecryption=True
            )
            parameter_value = parameter_response['Parameter']['Value']
            description = parameter_response['Parameter']["Description"] if "Decription" in parameter_response['Parameter'] else ""

            ssm_response = ssm_client.put_parameter(
                    Name=parameter_name,
                    Description=description,
                    Value=parameter_value,
                    Type='SecureString',
                    KeyId=args.cmk_arn,
                    Overwrite=True,
                )


        s3_buckets = filter(lambda x: x["ResourceType"] == "AWS::S3::Bucket",response["StackResourceSummaries"])
        for bucket in s3_buckets:
            response = s3_client.put_bucket_encryption(
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
        print(f"Processing stack {stack}")
        process_stacks(stack["PhysicalResourceId"])








    



    


        






