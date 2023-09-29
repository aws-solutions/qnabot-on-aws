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

import logging
import os

import pytest

from aws_solutions.core.logging import get_level, get_logger


@pytest.fixture(scope="function", autouse=True)
def reset_logging_defaults():
    """Remove any logging configuration defaults that might have existed before starting any test"""
    try:
        os.environ.pop("LOG_LEVEL")
    except KeyError:
        pass


@pytest.mark.parametrize("level", ["DEBUG", "INFO", "WARNING", "ERROR"])
def test_valid_levels(level):
    os.environ["LOG_LEVEL"] = level
    assert get_level() == level


def test_invalid_level():
    os.environ["LOG_LEVEL"] = "TRACE"
    assert get_level() == "WARNING"
    os.environ["LOG_LEVEL"] = "INFO"


def test_get_logger():
    logger = get_logger(__name__)
    assert logger.level == logging.WARNING


def test_logger_log(caplog):
    logger = get_logger(__name__)
    logger.error("This is an error")
    logger.warning("This is a warning")
    logger.info("This is an informational message")
    logger.debug("This is a debug message")

    assert "This is an error" in caplog.text
    assert "This is a warning" in caplog.text
    assert "This is an informational message" not in caplog.text
    assert "This is a debug message" not in caplog.text
