import click
import os
import json
import datetime
import time
import sys
from botocore.exceptions import ClientError
from aws_solutions.core.helpers import get_service_client


"""
Initiate import process
:param bucket: Bucket to import to
:param source_filename: import directory and filename
:return: response status of the import request
"""
def initiate_import (cloudformation_stack_name: str, source_filename: str, file_format: str, delete_existing_content: bool):
    importdatetime = datetime.datetime.utcnow() #get current request date time in UTC timezone
    #get Import bucket name from the cloudformation stack
    try:
        cfn_client = get_service_client("cloudformation")   #boto3.client('cloudformation')
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

    #create a options json config that includes import options that were used
    strImportOptions = {
        'source_filename': source_filename, 
        'options': {
            'delete_existing_content': delete_existing_content, 
            'file_format': file_format
        }, 
        'import_datetime': str(importdatetime), 
        'source_application': 'qnabot-cli'
    }
    strImportOptions = json.dumps(strImportOptions, indent=4)

    try:    #put object in S3 bucket
        s3_client = get_service_client("s3")    #boto3.client('s3')
        #create a options json config file that includes import options that were used
        response = s3_client.put_object (
            Bucket = strImportBucketName, 
            Key = 'options/' + os.path.basename(source_filename), 
            Body = strImportOptions
        )

        if file_format == 'JSON': 
            strFileContents = convert_json_to_jsonl (source_filename)   #convert to JSON Lines format (if input is JSON format)
            #upload the contents of the converted json file to S3
            response = s3_client.put_object (
                Bucket = strImportBucketName, 
                Key = 'data/' + os.path.basename(source_filename), 
                Body = strFileContents
            )
        else: 
            objFile = open (source_filename,"rb")   #open file object
            #upload the contents of the json file to S3
            response = s3_client.put_object (
                Bucket = strImportBucketName, 
                Key = 'data/' + os.path.basename(source_filename), 
                Body = objFile
            )
            objFile.close() #close file object

        #check status of the file import
        response = get_import_status (bucket = strImportBucketName, source_filename = source_filename, importdatetime = importdatetime)

        while json.loads(response)["status"] != 'Complete':
            time.sleep (5)  #wait for 5 seconds and check status again
            response = get_import_status (bucket = strImportBucketName, source_filename = source_filename, importdatetime = importdatetime)
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
def initiate_export (cloudformation_stack_name: str, export_filename: str, export_filter: str, file_format: str):
    exportdatetime = datetime.datetime.utcnow() #get current request date time in UTC timezone
    #get Export bucket name from the cloudformation stack
    try:
        cfn_client = get_service_client("cloudformation")   #boto3.client('cloudformation')
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
        strOpenSearchIndex = response["StackResourceDetail"]["PhysicalResourceId"]
    except ClientError as e:
        error_response (
            error_code = e.response["Error"]["Code"], 
            message = e.response["Error"]["Message"], 
            comments = 'Please check the CloudFormation Stack being used is for a QnABot deployment, and that the stack has deployed successfully.', 
            status = 'Error', 
            show_error = True
        )

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
        #put a export config object in S3 bucket to initiate export
        s3_client = get_service_client("s3")    #boto3.client('s3')
        response = s3_client.put_object (
            Body = strExportConfig, 
            Bucket = strExportBucketName, 
            Key = 'status/' + os.path.basename(export_filename)
        )

        #check status of the file export
        response = get_export_status (bucket = strExportBucketName, export_filename = export_filename, exportdatetime = exportdatetime)

        while json.loads(response)["status"] != 'Completed':
            time.sleep (5)  #wait for 5 seconds and check status again
            response = get_export_status (bucket = strExportBucketName, export_filename = export_filename, exportdatetime = exportdatetime)

        #download the exported file
        response = download_export (bucket = strExportBucketName, export_filename = export_filename, exportdatetime = exportdatetime, file_format = file_format)

        while json.loads(response)["status"] != 'Downloaded':
            time.sleep (5)  #wait for 5 seconds and check status again
            response = download_export (bucket = strExportBucketName, export_filename = export_filename, exportdatetime = exportdatetime, file_format = file_format)
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
def download_export (bucket: str, export_filename: str, exportdatetime: datetime, file_format: str):
        try:
            s3_client = get_service_client("s3")    #boto3.client('s3')
            #get object only if the object has changed since last request
            response = s3_client.get_object (
                Bucket = bucket, 
                Key = 'data/' + os.path.basename(export_filename), 
                IfModifiedSince = exportdatetime
            )
            strFileContents = response["Body"].read().decode("utf-8")   #read object body
            if file_format == 'JSON': 
                strFileContents = convert_jsonl_to_json (strFileContents = strFileContents) #convert to JSON format (if input is JSON Lines format)

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
        s3_client = get_service_client("s3")    #boto3.client('s3')
        #get object only if the object has changed since last request
        response = s3_client.get_object (
            Bucket = bucket, 
            Key = 'status/' + os.path.basename(source_filename), 
            IfModifiedSince = importdatetime
        )

        objStatusDetails = json.loads(response["Body"].read().decode("utf-8"))  #read object body

        returnResponse = {
            'number_of_qids_imported': 'N/A' if objStatusDetails["status"] != 'Complete' else objStatusDetails["count"], 
            'number_of_qids_failed_to_import': 'N/A' if objStatusDetails["status"] != 'Complete' else objStatusDetails["failed"], 
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
        s3_client = get_service_client("s3")    #boto3.client('s3')
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
Convert to JSON format
:param strFileContents: contents of JSON Lines file
:return: processed JSON string output
"""
def convert_jsonl_to_json (strFileContents: str):
    lines = strFileContents.splitlines()
    strOutput = ''

    for entry in lines:
        if strOutput != '': 
            strOutput = strOutput + ", " + entry
        else:
            strOutput = strOutput + entry

    if strOutput != '': 
        strOutput = '{"qna": [' + strOutput + "]}"

    return strOutput

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