######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import os
import json
import datetime
import time
import sys
from enum import Enum

import click
from botocore.exceptions import ClientError
from aws_solutions.core.helpers import get_service_client
from aws_solutions.core.logging import get_logger

logger = get_logger(__name__)


class BucketType(Enum):
    IMPORT_BUCKET = "ImportBucket"
    EXPORT_BUCKET = "ExportBucket"
    CONTENT_BUCKET = "ContentDesignerOutputBucket"


def get_bucket_name(cloudformation_stack_name: str, bucket_type: BucketType):
    """get bucket name from the cloudformation stack"""
    try:
        cfn_client = get_service_client("cloudformation")  # boto3.client('cloudformation')
        # get bucket name from the cloudformation stack
        response = cfn_client.describe_stack_resource(
            StackName=cloudformation_stack_name, LogicalResourceId=bucket_type.value
        )
        bucket_name = response["StackResourceDetail"]["PhysicalResourceId"]
    except ClientError as err_exception:
        return error_response(
            error_code=err_exception.response["Error"]["Code"],
            message=err_exception.response["Error"]["Message"],
            comments="Please check the CloudFormation Stack being used is for a QnABot deployment, "
            + "and that the stack has deployed successfully.",
            status="Error",
            show_error=True,
        )
    return bucket_name


def initiate_import(
    cloudformation_stack_name: str, source_filename: str, file_format: str, delete_existing_content: bool
):
    """
    Initiate import process
    :param bucket: Bucket to import to
    :param source_filename: import directory and filename
    :return: response status of the import request
    """

    importdatetime = datetime.datetime.now(datetime.timezone.utc)  # get current request date time in UTC timezone
    # get Import bucket name from the cloudformation stack
    str_import_bucket_name = get_bucket_name(cloudformation_stack_name, BucketType.IMPORT_BUCKET)
    str_content_bucket_name = get_bucket_name(cloudformation_stack_name, BucketType.CONTENT_BUCKET)

    # create an options json config that includes import options that were used
    str_import_options = {
        "source_filename": source_filename,
        "options": {"delete_existing_content": delete_existing_content, "file_format": file_format},
        "import_datetime": str(importdatetime),
        "source_application": "qnabot-cli",
    }
    str_import_options = json.dumps(str_import_options, indent=4)

    try:  # put object in S3 bucket
        s3_client = get_service_client("s3")  # boto3.client('s3')
        # create an options json config file that includes import options that were used
        response = s3_client.put_object(
            Bucket=str_import_bucket_name, Key=f"options/{os.path.basename(source_filename)}", Body=str_import_options
        )

        if file_format == "JSON":
            str_file_contents = convert_json_to_jsonl(
                source_filename
            )  # convert to JSON Lines format (if input is JSON format)
            # upload the contents of the converted json file to S3
            response = s3_client.put_object(
                Bucket=str_import_bucket_name, Key=f"data/{os.path.basename(source_filename)}", Body=str_file_contents
            )
        else:
            with open(source_filename, "rb") as obj_file:  # open file object
                # upload the contents of the json file to S3
                response = s3_client.put_object(
                    Bucket=str_import_bucket_name, Key=f"data/{os.path.basename(source_filename)}", Body=obj_file
                )

        # check status of the file import
        response = get_import_status(
            bucket=str_content_bucket_name, source_filename=source_filename, importdatetime=importdatetime
        )
        seconds = 0
        while json.loads(response)["status"] != "Complete" and seconds < 90:
            time.sleep(5)  # wait for 5 seconds and check status again
            response = get_import_status(
                bucket=str_content_bucket_name, source_filename=source_filename, importdatetime=importdatetime
            )
            seconds += 5
        return response
    except ClientError as err_exception:
        return error_response(
            error_code=err_exception.response["Error"]["Code"],
            message=err_exception.response["Error"]["Message"],
            comments="",
            status="Error",
            show_error=True,
        )


def initiate_export(cloudformation_stack_name: str, export_filename: str, export_filter: str, file_format: str):
    """
    Initiate export process
    :param bucket: Bucket to export to
    :param export_filename: export directory and filename
    :param strExportConfig: contents of the config object
    :return: response status of the export request
    """

    exportdatetime = datetime.datetime.now(datetime.timezone.utc)  # get current request date time in UTC timezone
    # get Export bucket name from the cloudformation stack
    str_export_bucket_name = get_bucket_name(cloudformation_stack_name, BucketType.EXPORT_BUCKET)
    str_content_bucket_name = get_bucket_name(cloudformation_stack_name, BucketType.CONTENT_BUCKET)

    cfn_client = get_service_client("cloudformation")
    # get OpenSearch cluster Index name from the cloudformation stack
    try:
        response = cfn_client.describe_stack_resource(StackName=cloudformation_stack_name, LogicalResourceId="Index")
        str_open_search_index = response["StackResourceDetail"]["PhysicalResourceId"]
    except ClientError as err_exception:
        return error_response(
            error_code=err_exception.response["Error"]["Code"],
            message=err_exception.response["Error"]["Message"],
            comments="Please check the CloudFormation Stack being used is for a QnABot deployment, "
            + "and that the stack has deployed successfully.",
            status="Error",
            show_error=True,
        )

    str_export_config = {
        "bucket": str_export_bucket_name,
        "index": str_open_search_index,
        "id": os.path.basename(export_filename),
        "config": f"status-export/{os.path.basename(export_filename)}",
        "tmp": f"tmp/{os.path.basename(export_filename)}",
        "key": f"data-export/{os.path.basename(export_filename)}",
        "filter": export_filter,
        "status": "Started",
    }
    str_export_config = json.dumps(str_export_config, indent=4)

    try:
        # put a export config object in S3 bucket to initiate export
        s3_client = get_service_client("s3")  # boto3.client('s3')
        response = s3_client.put_object(
            Body=str_export_config, Bucket=str_export_bucket_name, Key=f"status-export/{os.path.basename(export_filename)}"
        )

        # check status of the file export
        response = get_export_status(
            bucket=str_content_bucket_name, export_filename=export_filename, exportdatetime=exportdatetime
        )

        while json.loads(response)["status"] != "Completed":
            time.sleep(5)  # wait for 5 seconds and check status again
            response = get_export_status(
                bucket=str_content_bucket_name, export_filename=export_filename, exportdatetime=exportdatetime
            )

        # download the exported file
        response = download_export(
            bucket=str_content_bucket_name,
            export_filename=export_filename,
            exportdatetime=exportdatetime,
            file_format=file_format,
        )

        while json.loads(response)["status"] != "Downloaded":
            time.sleep(5)  # wait for 5 seconds and check status again
            response = download_export(
                bucket=str_content_bucket_name,
                export_filename=export_filename,
                exportdatetime=exportdatetime,
                file_format=file_format,
            )
        return response
    except ClientError as err_exception:
        return error_response(
            error_code=err_exception.response["Error"]["Code"],
            message=err_exception.response["Error"]["Message"],
            comments="",
            status="Error",
            show_error=True,
        )


def download_export(bucket: str, export_filename: str, exportdatetime: datetime, file_format: str):
    """
    Download a file from the {export} S3 bucket
    :param bucket: Bucket to download from
    :param export_filename: download to export directory path
    :param exportdatetime: the date time of the request in UTC timezone
    :return: response status of the download request
    """

    try:
        s3_client = get_service_client("s3")  # boto3.client('s3')
        # get object only if the object has changed since last request
        response = s3_client.get_object(
            Bucket=bucket, Key=f"data-export/{os.path.basename(export_filename)}", IfModifiedSince=exportdatetime
        )
        str_file_contents = response["Body"].read().decode("utf-8")  # read object body
        if file_format == "JSON":
            str_file_contents = convert_jsonl_to_json(
                str_file_contents=str_file_contents
            )  # convert to JSON format (if input is JSON Lines format)

        try:
            os.makedirs(os.path.dirname(export_filename), exist_ok=True)  # create export directory if does not exist
            with open(export_filename, "w", encoding="utf-8") as obj_file:  # open file in write mode
                obj_file.write(str_file_contents)  # write to file
            return_response = {
                "export_directory": export_filename,
                "status": "Downloaded",
                "comments": "Check the export directory for the downloaded export.",
                "error_code": "none",
            }
            return_response = json.dumps(return_response, indent=4)
            return return_response
        except OSError as err_exception:
            return error_response(
                error_code=err_exception.errno,
                message=err_exception.strerror,
                comments=f"There was an issue using: {export_filename} Check the path and try again.",
                status="Error",
                show_error=True,
            )
    except ClientError as err_exception:
        # if object has not been modified (304) or the object is not available in S3 bucket yet (NoSuchKey)
        if err_exception.response["Error"]["Code"] in ("304", "NoSuchKey"):
            return error_response(
                error_code=err_exception.response["Error"]["Code"],
                message=err_exception.response["Error"]["Message"],
                comments="Please note: Export processing may take longer to process depending on the "
                + "number of questions, and size of the download file.",
                status="Pending",
                show_error=False,
            )
        return error_response(
            error_code=err_exception.response["Error"]["Code"],
            message=err_exception.response["Error"]["Message"],
            comments="",
            status="Error",
            show_error=True,
        )


def get_import_status(bucket: str, source_filename: str, importdatetime: datetime):
    """
    Get a file from a S3 bucket
    :param bucket: Bucket to Get file from
    :param key: S3 object name
    :param importdatetime: the date time of the request in UTC timezone
    :return: response status from the contents of the import request file
    """

    try:
        s3_client = get_service_client("s3")  # boto3.client('s3')
        # get object only if the object has changed since last request
        key = f"status-import/{os.path.basename(source_filename)}"
        #logger.debug(f"Getting import status for {bucket=} {key=}")
        response = s3_client.get_object(Bucket=bucket, Key=key, IfModifiedSince=importdatetime)

        obj_status_details = json.loads(response["Body"].read().decode("utf-8"))  # read object body

        return_response = {
            "number_of_qids_imported": "N/A"
            if obj_status_details["status"] != "Complete"
            else obj_status_details["count"],
            "number_of_qids_failed_to_import": "N/A"
            if obj_status_details["status"] != "Complete"
            else obj_status_details["failed"],
            "import_starttime": obj_status_details["time"]["start"],
            "import_endtime": "N/A"
            if obj_status_details["status"] != "Complete"
            else obj_status_details["time"]["end"],
            "status": obj_status_details["status"],
            "error_code": "none",
        }
        return_response = json.dumps(return_response, indent=4)
        return return_response
    except ClientError as err_exception:
        # if object has not been modified (304) or the object is not available in S3 bucket yet (NoSuchKey)
        if err_exception.response["Error"]["Code"] in ("304", "NoSuchKey"):
            return error_response(
                error_code=err_exception.response["Error"]["Code"],
                message=err_exception.response["Error"]["Message"],
                comments="Please note: Import processing may take longer to process depending on the size of the file.",
                status="Pending",
                show_error=False,
            )
        return error_response(
            error_code=err_exception.response["Error"]["Code"],
            message=err_exception.response["Error"]["Message"],
            comments="",
            status="Error",
            show_error=True,
        )


def get_export_status(bucket: str, export_filename: str, exportdatetime: datetime):
    """
    Get a file from a S3 bucket
    :param bucket: Bucket to Get file from
    :param key: S3 object name
    :param exportdatetime: the date time of the request in UTC timezone
    :return: response status from the contents of the export request file
    """

    try:
        s3_client = get_service_client("s3")  # boto3.client('s3')
        # get object only if the object has changed since last request
        response = s3_client.get_object(
            Bucket=bucket, Key=f"status-export/{os.path.basename(export_filename)}", IfModifiedSince=exportdatetime
        )

        obj_status_details = json.loads(response["Body"].read().decode("utf-8"))  # read object body

        return_response = {"status": obj_status_details["status"], "error_code": "none"}
        return_response = json.dumps(return_response, indent=4)
        return return_response
    except ClientError as err_exception:
        # if object has not been modified (304) or the object is not available in S3 bucket yet (NoSuchKey)
        if err_exception.response["Error"]["Code"] in ("304", "NoSuchKey"):
            return error_response(
                error_code=err_exception.response["Error"]["Code"],
                message=err_exception.response["Error"]["Message"],
                comments="Please note: Export processing may take longer to process "
                + "depending on the number of questions.",
                status="Pending",
                show_error=False,
            )
        return error_response(
            error_code=err_exception.response["Error"]["Code"],
            message=err_exception.response["Error"]["Message"],
            comments="",
            status="Error",
            show_error=True,
        )


def convert_json_to_jsonl(source_filename: str):
    """
    Convert to JSON Lines format
    :param source_filename: import directory and filename
    :return: file contents
    """

    error_msg = f"There was an error reading the file. {source_filename}. Check the file format and try again."

    try:
        with open(source_filename, "rb") as obj_file:  # open file in read mode
            str_file_contents = obj_file.read()  # read from file
        try:
            str_file_contents = json.loads(str_file_contents)
            str_lines = ""
            for entry in str_file_contents["qna"]:
                str_lines = str_lines + json.dumps(entry) + "\n"
            return str_lines
        except json.decoder.JSONDecodeError as err_exception:
            return error_response(
                error_code="",
                message=err_exception.msg,
                comments=error_msg,
                status="Error",
                show_error=True,
            )
        except UnicodeDecodeError as err_exception:
            return error_response(
                error_code="",
                message=err_exception.__doc__,
                comments=error_msg,
                status="Error",
                show_error=True,
            )
        except TypeError as err_exception:
            return error_response(
                error_code="",
                message=err_exception.__doc__,
                comments=error_msg,
                status="Error",
                show_error=True,
            )
    except OSError as err_exception:
        return error_response(
            error_code=err_exception.errno,
            message=err_exception.strerror,
            comments=f"There was an error reading the file {source_filename}. Check the path and try again",
            status="Error",
            show_error=True,
        )


def convert_jsonl_to_json(str_file_contents: str):
    """
    Convert to JSON format
    :param strFileContents: contents of JSON Lines file
    :return: processed JSON string output
    """

    lines = str_file_contents.splitlines()
    str_output = ""

    for entry in lines:
        if str_output != "":
            str_output = str_output + ", " + entry
        else:
            str_output = str_output + entry

    if str_output != "":
        str_output = '{"qna": [' + str_output + "]}"

    return str_output


def error_response(error_code: str, message: str, comments: str, status: str, show_error: bool):
    """
    Error response
    :param error_code: exception error code
    :param message: exception error message
    :param comments: exception comments
    :param status: status to return in response
    :return: response json
    """

    return_response = {"error_code": error_code, "error_message": message, "comments": comments, "status": status}
    return_response = json.dumps(return_response, indent=4)

    if show_error:
        click.echo(f"[Error] {str(error_code)}: {message}. {comments}")
        sys.exit(1)
    else:
        return return_response
