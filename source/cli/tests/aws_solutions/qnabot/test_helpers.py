######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#                                                                                                                    #
#  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    #
#  with the License. A copy of the License is located at                                                             #
#                                                                                                                    #
#      http://www.apache.org/licenses/LICENSE-2.0                                                                    #
#                                                                                                                    #
#  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES #
#  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    #
#  and limitations under the License.                                                                                #
######################################################################################################################

import os
import threading
from pathlib import Path

import pytest
from moto import mock_sts, mock_s3

from aws_solutions.core.logging import get_logger
from aws_solutions.qnabot.cli import qnabot_cli_helper
from tests.aws_solutions.qnabot.fixtures.cloudformation_fixtures import (  # NOSONAR 
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
@pytest.mark.skip(reason='Test fails in pipeline; passes locally.')
def test_qna_import_json(  # NOSONAR 
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
@pytest.mark.skip(reason='Test fails in pipeline; passes locally.')
def test_qna_export_json(  # NOSONAR 
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
@pytest.mark.skip(reason='Test fails in pipeline; passes locally.')
def test_qna_import_invalid_stack(  # NOSONAR 
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
