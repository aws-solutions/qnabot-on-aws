#!/usr/bin/env python
######################################################################################################################
#  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                #
#  SPDX-License-Identifier: Apache-2.0                                                                               #
######################################################################################################################

import os
import pytest

@pytest.fixture
def event():
    return {
        'res': {
            'message': 'test'
        },
        'req': 'test',
    }

@pytest.fixture
def context():
    return {}
