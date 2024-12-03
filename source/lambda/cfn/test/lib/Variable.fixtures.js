/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.s3BucketObject = function() {
    const response = {
        key: 'mock_key',
        value: 'mock_value',
        mock_object: {
            key: 'mock_object_key',
            value: 'MOCK_OBJECT_VALUE',
            op: 'toLowerCase'
        }
    }

    return response;
}