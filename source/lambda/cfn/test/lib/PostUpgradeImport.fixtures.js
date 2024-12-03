/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.postUpgradeImportObject = function() {
    const response = {
        exportbucket: 'mock_export_bucket',
        importbucket: 'mock_import_bucket',
        index: 'mock_index',
        id: 'mock_id',
        config: 'mock_config_id',
        tmp: 'mock_temp_id',
        key: 'mock_key'
    }

    return response;
}

exports.s3InputObject = function() {
    const response = {
        bucket: 'mock_import_bucket',
        index: 'mock_index',
        id: 'mock_id',
        config: 'mock_config_id',
        tmp: 'mock_temp_id',
        key: 'mock_key',
        filter: '',
        status: 'mock_status'
    }

    return response;
}
