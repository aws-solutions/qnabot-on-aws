import click
import boto3
from botocore.exceptions import ClientError
import os
import json
import datetime
import time
import sys
import io

CONTEXT_SETTINGS = dict(help_option_names=['-h', '--help'])
@click.group(context_settings=CONTEXT_SETTINGS)
@click.pass_context
def cli(ctx) -> None:
    pass


@cli.command("import")
@click.option("-s", "--cloudformation-stack-name", type=click.STRING, help="Provide the name of the CloudFormation stack of your AWS QnABot deployment", required=True)
@click.option("-f", "--source-filename", type=click.STRING, help="Provide the filename along with path where the file to be imported is located", required=True)
@click.option("-fmt", "--file-format", type=click.Choice(['JSON', 'JSONL', 'XLSX'], case_sensitive=False), help="Provide the file format to use for import", required=False, default="JSON", show_default=True)
@click.pass_context
def qna_import (ctx, cloudformation_stack_name: str, source_filename: str, file_format: str):
    """
    Import QnABot questions and answers to your QnABot setup.\n
    This command requires two (2) parameters: <cloudformation-stack-name>, <source-filename>.
    The cloudformation-stack-name parameter is used to know the AWS QnABot deployment to use to support the import process. \n
    """
    try:
        cfn_client = boto3.client('cloudformation')
        #get Import bucket name from the cloudformation stack
        response = cfn_client.describe_stack_resource (
            StackName = cloudformation_stack_name,
            LogicalResourceId = 'ImportBucket'
        )
        strImportBucketName = response["StackResourceDetail"]["PhysicalResourceId"]
    except ClientError as e:
        error_response (
            error_code = e.response["Error"]["Code"], 
            message = e.response["Error"]["Message"], 
            comments = 'Please check the CloudFormation Stack being used is for a QnABot deployment, and that the stack has deployed successfully.', 
            status = 'Error', 
            show_error = True
        )

    try: 
        response = initiate_import (bucket = strImportBucketName, source_filename = source_filename, file_format = file_format) #proceed with upload file to Amazon S3
        click.echo (response)
        sys.exit (0)
    except OSError as e: 
        error_response (
            error_code = e.errno, 
            message = e.strerror, 
            comments = source_filename + " not found. Check the path and try again.", 
            status = 'Error', 
            show_error = True
        )


@cli.command("export")
@click.option("-s", "--cloudformation-stack-name", type=click.STRING, help="Provide the name of the CloudFormation stack of your AWS QnABot deployment", required=True)
@click.option("-f", "--export-filename", type=click.STRING, help="Provide the filename along with path where the exported file should be downloaded to", required=True)
@click.option("-qids", "--export-filter", help="Export {qids} that start with this filter string. Exclude this option to export all {qids} ", required=False, default="")
@click.pass_context
def qna_export (ctx, cloudformation_stack_name: str, export_filename: str, export_filter: str):
    """
    Export QnABot questions and answers from your QnABot setup.\n
    This command requires two (2) parameters: <cloudformation-stack-name>, and <export-filename>.
    The cloudformation-stack-name parameter is used to know the AWS QnABot deployment to use to support the export process. \n
    """
    #get Export bucket name from the cloudformation stack
    try:
        cfn_client = boto3.client('cloudformation')
        response = cfn_client.describe_stack_resource (
            StackName = cloudformation_stack_name,
            LogicalResourceId = 'ExportBucket'
        )
        strExportBucketName = response["StackResourceDetail"]["PhysicalResourceId"]
    except ClientError as e:
        error_response (
            error_code = e.response["Error"]["Code"], 
            message = e.response["Error"]["Message"], 
            comments = 'Please check the CloudFormation Stack being used is for a QnABot deployment, and that the stack has deployed successfully.', 
            status = 'Error', 
            show_error = True
        )

    #get OpenSearch cluster Index name from the cloudformation stack
    try:
        response = cfn_client.describe_stack_resource (
            StackName = cloudformation_stack_name,
            LogicalResourceId = 'Index'
        )
    except ClientError as e:
        error_response (
            error_code = e.response["Error"]["Code"], 
            message = e.response["Error"]["Message"], 
            comments = 'Please check the CloudFormation Stack being used is for a QnABot deployment, and that the stack has deployed successfully.', 
            status = 'Error', 
            show_error = True
        )

    strOpenSearchIndex = response["StackResourceDetail"]["PhysicalResourceId"]

    strExportConfig = {
        'bucket': strExportBucketName, 
        'index': strOpenSearchIndex, 
        'id': os.path.basename(export_filename), 
        'config': 'status/' + os.path.basename(export_filename), 
        'tmp': 'tmp/' + os.path.basename(export_filename), 
        'key': 'data/' + os.path.basename(export_filename), 
        'filter': export_filter, 
        'status': 'Started'
    }
    strExportConfig = json.dumps(strExportConfig, indent=4)
    try: 
        response = initiate_export (bucket = strExportBucketName, export_filename = export_filename, export_config = strExportConfig) #proceed with initiating the export process
        click.echo (response)
        sys.exit (0)
    except OSError as e: 
        error_response (
            error_code = e.errno, 
            message = e.strerror, 
            comments = "There was an issue using: " + export_filename + " Check the path and try again.", 
            status = 'Error', 
            show_error = True
        )


"""
Initiate import process
:param bucket: Bucket to import to
:param source_filename: import directory and filename
:return: response status of the import request
"""
def initiate_import (bucket: str, source_filename: str, file_format: str):
    importdatetime = datetime.datetime.utcnow() #get current request date time in UTC timezone

    try:    #put object in S3 bucket
        s3_client = boto3.client('s3')
        if file_format == 'JSON': 
            strFileContents = convert_json_to_jsonl (source_filename)
            response = s3_client.put_object (
                Bucket = bucket, 
                Key = 'data/' + os.path.basename(source_filename), 
                Body = strFileContents
            )
        else: 
            s3_client.upload_file (
                Bucket = bucket, 
                Filename = source_filename, 
                Key = 'data/' + os.path.basename(source_filename)
            )

        #check status of the file import
        response = get_import_status (bucket = bucket, source_filename = source_filename, importdatetime = importdatetime)

        while json.loads(response)["status"] != 'Complete':
            time.sleep (5)  #wait for 5 seconds and check status again
            response = get_import_status (bucket = bucket, source_filename = source_filename, importdatetime = importdatetime)
        return response
    except ClientError as e:
        error_response (
            error_code = e.response["Error"]["Code"], 
            message = e.response["Error"]["Message"], 
            comments = '', 
            status = 'Error', 
            show_error = True
        )


"""
Initiate export process
:param bucket: Bucket to export to
:param export_filename: export directory and filename
:param strExportConfig: contents of the config object
:return: response status of the export request
"""
def initiate_export (bucket: str, export_filename: str, export_config: str):
    exportdatetime = datetime.datetime.utcnow() #get current request date time in UTC timezone

    try:
        #put a export config object in S3 bucket to initiate export
        s3_client = boto3.client('s3')
        response = s3_client.put_object (
            Body = export_config, 
            Bucket = bucket, 
            Key = 'status/' + os.path.basename(export_filename)
        )

        #check status of the file export
        response = get_export_status (bucket = bucket, export_filename = export_filename, exportdatetime = exportdatetime)

        while json.loads(response)["status"] != 'Completed':
            time.sleep (5)  #wait for 5 seconds and check status again
            response = get_export_status (bucket = bucket, export_filename = export_filename, exportdatetime = exportdatetime)

        #download the exported file
        response = download_export (bucket = bucket, export_filename = export_filename, exportdatetime = exportdatetime)

        while json.loads(response)["status"] != 'Downloaded':
            time.sleep (5)  #wait for 5 seconds and check status again
            response = download_export (bucket = bucket, export_filename = export_filename, exportdatetime = exportdatetime)
        return response
    except ClientError as e:
        error_response (
            error_code = e.response["Error"]["Code"], 
            message = e.response["Error"]["Message"], 
            comments = '', 
            status = 'Error', 
            show_error = True
        )


"""
Download a file from the {export} S3 bucket
:param bucket: Bucket to download from
:param export_filename: download to export directory path
:param exportdatetime: the date time of the request in UTC timezone
:return: response status of the download request
"""
def download_export (bucket: str, export_filename: str, exportdatetime: datetime):
        try:
            s3_client = boto3.client('s3')
            #get object only if the object has changed since last request
            response = s3_client.get_object (
                Bucket = bucket, 
                Key = 'data/' + os.path.basename(export_filename), 
                IfModifiedSince = exportdatetime
            )
            strFileContents = response["Body"].read().decode("utf-8")   #read object body
            try: 
                os.makedirs (os.path.dirname(export_filename), exist_ok=True) #create export directory if does not exist
                objFile = open(export_filename, "w")    #open file in write mode
                objFile.write(strFileContents)  #write to file
                objFile.close() #close file object
                returnResponse = {
                    'export_directory': export_filename, 
                    'status': 'Downloaded', 
                    'comments': 'Check the export directory for the downloaded export.', 
                    'error_code': 'none', 
                }
                returnResponse = json.dumps(returnResponse, indent=4)
                return returnResponse
            except OSError as e: 
                error_response (
                    error_code = e.errno, 
                    message = e.strerror, 
                    comments = "There was an issue using: " + export_filename + " Check the path and try again.", 
                    status = 'Error', 
                    show_error = True
                )
        except ClientError as e:
            if e.response["Error"]["Code"] in ('304', 'NoSuchKey'): #if object has not been modified (304) or the object is not available in S3 bucket yet (NoSuchKey)
                return error_response (
                    error_code = e.response["Error"]["Code"], 
                    message = e.response["Error"]["Message"], 
                    comments = 'Please note: Export processing may take longer to process depending on the number of questions and size of the download file.', 
                    status = 'Pending', 
                    show_error = False
                )
            else: 
                error_response (
                    error_code = e.response["Error"]["Code"], 
                    message = e.response["Error"]["Message"], 
                    comments = '', 
                    status = 'Error', 
                    show_error = True
                )


"""
Get a file from a S3 bucket
:param bucket: Bucket to Get file from
:param key: S3 object name
:param importdatetime: the date time of the request in UTC timezone
:return: response status from the contents of the import request file 
"""
def get_import_status (bucket: str, source_filename: str, importdatetime: datetime):
    try:
        s3_client = boto3.client('s3')
        #get object only if the object has changed since last request
        response = s3_client.get_object (
            Bucket = bucket, 
            Key = 'status/' + os.path.basename(source_filename), 
            IfModifiedSince = importdatetime
        )

        objStatusDetails = json.loads(response["Body"].read().decode("utf-8"))  #read object body

        returnResponse = {
            'number_of_lines_imported': 'N/A' if objStatusDetails["status"] != 'Complete' else objStatusDetails["count"], 
            'number_of_lines_failed_to_import': 'N/A' if objStatusDetails["status"] != 'Complete' else objStatusDetails["failed"], 
            'import_starttime': objStatusDetails["time"]["start"], 
            'import_endtime': 'N/A' if objStatusDetails["status"] != 'Complete' else objStatusDetails["time"]["end"], 
            'status': objStatusDetails["status"], 
            'error_code': 'none'
        }
        returnResponse = json.dumps(returnResponse, indent=4)
        return returnResponse
    except ClientError as e:
        if e.response["Error"]["Code"] in ('304', 'NoSuchKey'): #if object has not been modified (304) or the object is not available in S3 bucket yet (NoSuchKey)
            return error_response (
                error_code = e.response["Error"]["Code"], 
                message = e.response["Error"]["Message"], 
                comments = 'Please note: Import processing may take longer to process depending on the size of the file.', 
                status = 'Pending', 
                show_error = False
            )
        else: 
            error_response (
                error_code = e.response["Error"]["Code"], 
                message = e.response["Error"]["Message"], 
                comments = '', 
                status = 'Error', 
                show_error = True
            )


"""
Get a file from a S3 bucket
:param bucket: Bucket to Get file from
:param key: S3 object name
:param exportdatetime: the date time of the request in UTC timezone
:return: response status from the contents of the export request file 
"""
def get_export_status (bucket: str, export_filename: str, exportdatetime: datetime):
    try:
        s3_client = boto3.client('s3')
        #get object only if the object has changed since last request
        response = s3_client.get_object (
            Bucket = bucket, 
            Key = 'status/' + os.path.basename(export_filename), 
            IfModifiedSince = exportdatetime
        )

        objStatusDetails = json.loads(response["Body"].read().decode("utf-8"))  #read object body

        returnResponse = {
            'status': objStatusDetails["status"], 
            'error_code': 'none'
        }
        returnResponse = json.dumps(returnResponse, indent=4)
        return returnResponse
    except ClientError as e:
        if e.response["Error"]["Code"] in ('304', 'NoSuchKey'): #if object has not been modified (304) or the object is not available in S3 bucket yet (NoSuchKey)
            return error_response (
                error_code = e.response["Error"]["Code"], 
                message = e.response["Error"]["Message"], 
                comments = 'Please note: Export processing may take longer to process depending on the number of questions.', 
                status = 'Pending', 
                show_error = False
            )
        else: 
            error_response (
                error_code = e.response["Error"]["Code"], 
                message = e.response["Error"]["Message"], 
                comments = '', 
                status = 'Error', 
                show_error = True
            )


"""
Convert to JSON Lines format
:param source_filename: import directory and filename
:return: file contents
"""
def convert_json_to_jsonl (source_filename: str):
    try: 
        objFile = open (source_filename, 'rb')   #open file in read mode
        strFileContents = objFile.read()    #read from file
        objFile.close() #close file object
        try: 
            strFileContents = json.loads(strFileContents)
            strLines = ''
            for entry in strFileContents["qna"]:
                strLines = strLines + json.dumps(entry) + '\n'
            return (strLines)
        except json.decoder.JSONDecodeError as e:
            error_response (
                error_code = '', 
                message = e.msg, 
                comments = "There was an error reading the file " + source_filename + ". Check the path and try again", 
                status = 'Error', 
                show_error = True
            )
        except TypeError as e:
            error_response (
                error_code = '', 
                message = e.__doc__, 
                comments = "There was an error reading the file " + source_filename + ". Check the path and try again", 
                status = 'Error', 
                show_error = True
            )
    except OSError as e: 
        error_response (
            error_code = e.errno, 
            message = e.strerror, 
            comments = "There was an error reading the file " + source_filename + ". Check the path and try again", 
            status = 'Error', 
            show_error = True
        )


"""
Error response
:param error_code: exception error code
:param message: exception error message
:param comments: exception comments
:param status: status to return in response
:return: response json
"""
def error_response (error_code: str, message: str, comments: str, status: str, show_error: bool):
    returnResponse = {
        'error_code': error_code, 
        'error_message': message, 
        'comments': comments, 
        'status': status
    }
    returnResponse = json.dumps(returnResponse, indent=4)

    if show_error:
        click.echo ("[Error] " + str(error_code) + ": " + message + ". " + comments)
        sys.exit (1)
    else: 
        return returnResponse


if __name__ == "__main__":
    cli()