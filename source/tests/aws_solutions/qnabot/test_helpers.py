# Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: Apache-2.0

import os
import threading
from pathlib import Path

import pytest
from moto import mock_sts, mock_s3

from aws_solutions.core.logging import get_logger
from aws_solutions.qnabot.cli import qnabot_cli_helper
from tests.aws_solutions.qnabot.fixtures.cloudformation_fixtures import (  # NOSONAR # pylint: disable=unused-import
    cloudformation_stacks_fixture,
)
from tests.aws_solutions.qnabot.fixtures.s3_fixtures import (
    get_s3_fixture,
    mock_export_event,
    mock_import_event,
)

logger = get_logger(__name__)


@mock_sts
@mock_s3
def test_qna_import_json(  # NOSONAR # pylint: disable=unused-argument, redefined-outer-name
    cloudformation_stacks_fixture,
):
    cloudformation_stack_name = "test_stack"
    file_name = "blog-samples.json"
    base_dir = Path(__file__).parent.parent.parent.parent.parent
    source_filename = str((base_dir / "assets" / "examples" / "documents" / file_name).absolute())
    file_format = "JSON"
    delete_existing_content = True
    bucket_name = qnabot_cli_helper.get_bucket_name(
        cloudformation_stack_name, qnabot_cli_helper.BucketType.IMPORT_BUCKET
    )
    assert isinstance(bucket_name, str)
    logger.debug(f"test_qna_import: {bucket_name=}")
    get_s3_fixture(bucket_name)

    timer = threading.Timer(3, mock_import_event, [bucket_name, file_name])
    timer.start()
    response = qnabot_cli_helper.initiate_import(
        cloudformation_stack_name=cloudformation_stack_name,
        source_filename=source_filename,
        file_format=file_format,
        delete_existing_content=delete_existing_content,
    )
    assert response
    logger.debug(f"{response=}")


@mock_sts
@mock_s3
def test_qna_export_json(  # NOSONAR # pylint: disable=unused-argument, redefined-outer-name
    cloudformation_stacks_fixture,
):
    cloudformation_stack_name = "test_stack"
    base_dir = Path(__file__).parent.parent.parent.parent.parent
    file_name = "sample.json"
    export_filename = str((base_dir / "source" / "tests" / file_name).absolute())
    file_format = "JSON"
    export_filter = "some_filter"
    bucket_name = qnabot_cli_helper.get_bucket_name(
        cloudformation_stack_name, qnabot_cli_helper.BucketType.EXPORT_BUCKET
    )
    assert isinstance(bucket_name, str)
    logger.debug(f"test_qna_export: {bucket_name=}")
    get_s3_fixture(bucket_name)

    timer = threading.Timer(3, mock_export_event, [bucket_name])
    timer.start()

    response = qnabot_cli_helper.initiate_export(
        cloudformation_stack_name=cloudformation_stack_name,
        export_filename=export_filename,
        file_format=file_format,
        export_filter=export_filter,
    )
    assert response
    logger.debug(f"{response=}")
    assert Path(export_filename).is_file()
    os.remove(export_filename)


@mock_sts
@mock_s3
def test_qna_import_invalid_stack(  # NOSONAR # pylint: disable=unused-argument, redefined-outer-name
    cloudformation_stacks_fixture,
):
    cloudformation_stack_name = "non-existing-stack"
    with pytest.raises(SystemExit) as exception_info:
        response = qnabot_cli_helper.get_bucket_name(
            cloudformation_stack_name, qnabot_cli_helper.BucketType.IMPORT_BUCKET
        )
        # we don't expect to reach here
        logger.debug(f"test_qna_import_invalid_stack: {response=}")

    assert exception_info.value.code == 1
