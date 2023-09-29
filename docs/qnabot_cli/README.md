# AWS QnABot Command Line Interface (CLI)

The AWS QnABot CLI supports the capability to `import` and `export` questions and answers from your QnABot setup. 


## Setup Prerequisites
To use the CLI, the following prerequisites are required:
- Download the `source` directory from codebase of AWS QnABot Solution (version 5.2.0 or higher) in [GitHub](https://github.com/aws-solutions/aws-qnabot)
- AWS Command Line Interface (CLI). For more information, refer to: https://aws.amazon.com/cli/
- Python version 3.7 or higher. For more information on installing Python, refer to: https://docs.python.org/3/using/index.html
- AWS IAM permissions having the below IAM policy. Attach the below IAM policy to the IAM user or IAM Role that you are using for the AWS CLI. Replace the below values when creating the IAM policy:
````
- AWS_REGION -- the AWS Region where you have deployed the AWS QnABot solution
- AWS_ACCOUNT_ID -- the AWS Account ID where you have deployed the AWS QnABot solution
- YOUR_QNABOT_IMPORT_BUCKET_NAME -- the name of the AWS QnABot import bucket name. This can be found by navigating to the Resources section (in AWS CloudFormation) of the deployed AWS QnABot CLoudformation template
- YOUR_QNABOT_EXPORT_BUCKET_NAME -- the name of the AWS QnABot export bucket name. This can be found by navigating to the Resources section (in AWS CloudFormation) of the deployed AWS QnABot CLoudformation template
- YOUR_QNABOT_STACK_NAME -- the name of the AWS QnABot stack that you deployed via AWS CloudFormation
````


### IAM Policy
````
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "S3ReadWriteStatement",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": [
                "arn:aws:s3:::YOUR_QNABOT_IMPORT_BUCKET_NAME/*",
                "arn:aws:s3:::YOUR_QNABOT_EXPORT_BUCKET_NAME/*",
            ]
        },
        {
            "Sid": "CloudFormationDescribeStatement",
            "Effect": "Allow",
            "Action": "cloudformation:DescribeStackResource",
            "Resource": "arn:aws:cloudformation:AWS_REGION:AWS_ACCOUNT_ID:stack/YOUR_QNABOT_STACK_NAME/*"
        }
    ]
}
````

## Environment Setup 
You can get started by creating a virtual environment and deploy the needed Python packages. 
From a directory outside of the AWS QnABot codebase, run the below commands: 
````
pip3 install virtualenv
python3 -m virtualenv .venv
source ./.venv/bin/activate
cd source
pip3 install -r requirements.txt
````
This will setup a virtual environment and install the below Python packages:
- `boto3` Python module version 1.21.18. For more information, refer to: https://aws.amazon.com/sdk-for-python/
- `Click` Python module version 8.0.4. For more information, refer to: https://pypi.org/project/click/


### Set Environment variables

Set the `AWS_Region` you will be using. For example, to use the `us-east-1` AWS region, run the below command: 

`export AWS_REGION='us-east-1'`

Set the `PYTHONPATH` using the below command.

`export PYTHONPATH=${PWD}:$PYTHONPATH`


## Usage

### Available Commands
The `qnabot_cli.py` file is located in `source/aws_solutions/qnabot/cli` directory. 

Use `python3 aws_solutions/qnabot/cli/qnabot_cli.py` to run the below commands
````
Usage: qnabot_cli.py [OPTIONS] COMMAND [ARGS]...

Options:
  -h, --help  Show this message and exit.

Commands:
  export  Export QnABot questions and answers from your QnABot setup.
  import  Import QnABot questions and answers to your QnABot setup.
````


### Using the `import` Command
````
Usage: qnabot_cli.py import [OPTIONS]

  Import QnABot questions and answers to your QnABot setup.

  This command requires two (2) parameters: <cloudformation-stack-name>,
  <source-filename>. The cloudformation-stack-name parameter is used to know
  the AWS QnABot deployment to use to support the import process.

Options:
  -s, --cloudformation-stack-name TEXT
                                  Provide the name of the CloudFormation stack
                                  of your AWS QnABot deployment  [required]
  -f, --source-filename TEXT      Provide the filename along with path where
                                  the file to be imported is located
                                  [required]
  -fmt, --file-format [JSON|JSONL|XLSX]
                                  Provide the file format to use for import
                                  [default: JSON]
  -d, --delete-existing-content BOOLEAN
                                  Use this parameter if all existing QnABot
                                  {qids} in your QnABot deployment should be
                                  deleted before the import process.
                                  [default: False]
  -h, --help                      Show this message and exit.


A successful import will output status with the below information:

{
    "number_of_qids_imported": <number>,
    "number_of_qids_failed_to_import": <number>,
    "import_starttime": <datetime in UTC>,
    "import_endtime": <datetime in UTC>",
    "status": "Complete",
    "error_code": "none"
}

Example:

{
    "number_of_qids_imported": 9,
    "number_of_qids_failed_to_import": 0,
    "import_starttime": "2022-03-20T21:39:28.455Z",
    "import_endtime": "2022-03-20T21:39:32.193Z",
    "status": "Complete",
    "error_code": "none"
}


````


### Using the `export` Command
````
Usage: qnabot_cli.py export [OPTIONS]

  Export QnABot questions and answers from your QnABot setup.

  This command requires two (2) parameters: <cloudformation-stack-name>, and
  <export-filename>. The cloudformation-stack-name parameter is used to know
  the AWS QnABot deployment to use to support the export process.

Options:
  -s, --cloudformation-stack-name TEXT
                                  Provide the name of the CloudFormation stack
                                  of your AWS QnABot deployment  [required]
  -f, --export-filename TEXT      Provide the filename along with path where
                                  the exported file should be downloaded to
                                  [required]
  -qids, --export-filter TEXT     Export {qids} that start with this filter
                                  string. Exclude this option to export all
                                  {qids}
  -fmt, --file-format [JSON|JSONL]
                                  Provide the file format to use for export
                                  [default: JSON]
  -h, --help                      Show this message and exit.


A successful export will output status with the below information:

{
    "export_directory": <string>,
    "status": "Downloaded",
    "comments": <string>,
    "error_code": "none"
}

Example: 

{
    "export_directory": "../export/qna.json",
    "status": "Downloaded",
    "comments": "Check the export directory for the downloaded export.",
    "error_code": "none"
}
````

### Running as a Shell Script

#### `import` Example
````
#!/bin/bash
export AWS_REGION='us-east-1'
shell_output=$(python3 qnabot_cli.py import -s qnabot-stack -f ../import/qna_import.json -fmt json) 
STATUS="${?}"
if [ "${STATUS}" == 0 ];
then
    echo "AWS QnABot import completed successfully"
    echo "$shell_output"
else
    echo "AWS QnABot import failed"
    echo "$shell_output"
fi
````

#### `export` Example
````
#!/bin/bash
export AWS_REGION='us-east-1'
shell_output=$(python3 qnabot_cli.py export -s qnabot-stack -f ../export/qna_export.json -fmt json) 
STATUS="${?}"
if [ "${STATUS}" == 0 ];
then
    echo "AWS QnABot export completed successfully"
    echo "$shell_output"
else
    echo "AWS QnABot export failed"
    echo "$shell_output"
fi

````


