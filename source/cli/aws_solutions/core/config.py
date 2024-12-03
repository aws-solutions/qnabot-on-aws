######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import os
import re
from typing import Dict

import botocore.config

from aws_solutions.core.logging import get_logger

logger = get_logger(__name__)


SOLUTION_ID_RE = re.compile(r"^SO(?P<id>\d+)(?P<component>[a-zA-Z]*)$")  # NOSONAR
SOLUTION_VERSION_RE = re.compile(
    r"^v(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)(?:-(?P<prerelease>(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?P<buildmetadata>[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$"  # NOSONAR 
)


class SolutionConfigEnv:
    def __init__(self, env_var, default: str = "", regex: re.Pattern = None):
        self._env_var = env_var
        self._regex = regex
        self._value = default

    def _get_value_or_default(self) -> str:
        if self._value:
            return self._value
        return os.environ.get(self._env_var)

    def __get__(self, instance, owner) -> str:
        value = str(self._get_value_or_default())
        if self._regex and not self._regex.match(value):
            raise ValueError(
                f"`{value}` received, but environment variable {self._env_var} "
                + "(or default) must be set and match the pattern {self._regex.pattern}"
            )
        return value

    def __set__(self, instance, value) -> None:
        self._value = value


class Config: 
    """Stores information about the current solution"""

    id = SolutionConfigEnv("SOLUTION_ID", regex=SOLUTION_ID_RE)
    version = SolutionConfigEnv("SOLUTION_VERSION", regex=SOLUTION_VERSION_RE)
    _botocore_config = None

    @property
    def botocore_config(self) -> botocore.config.Config:
        if not self._botocore_config:
            self._botocore_config = botocore.config.Config(**self._botocore_config_defaults)
        return self._botocore_config

    @botocore_config.setter
    def botocore_config(self, other_config: botocore.config.Config):
        self._botocore_config = self.botocore_config.merge(other_config)

    @property
    def _botocore_config_defaults(self) -> Dict:
        return {"user_agent_extra": f"AwsSolution/{self.id}/{self.version}"}
