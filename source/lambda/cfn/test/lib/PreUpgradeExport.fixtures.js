/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

exports.preUpgradeExportObject = function() {
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
