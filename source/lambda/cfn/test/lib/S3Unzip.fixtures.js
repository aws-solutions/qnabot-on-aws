/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.s3GetObjectCommand = function() {
    const response = {
        DstBucket: 'mock_bucket',
        Key: 'mock_key',
        SrcBucket: 'mock_source_bucket'
    }

    return response;
}

exports.s3BucketObject = function() {
    const response = {
        Bucket: 'mock_bucket',
        Key: 'mock_key',
        ContentType: 'mock_type'
    }

    return response;
}

exports.jsZipSpyObject = function() {
    const response = {
        files: {
            file: {
                key: 'mock_key',
                path: 'mock_path'
            }
        }
    }

    return response;
}