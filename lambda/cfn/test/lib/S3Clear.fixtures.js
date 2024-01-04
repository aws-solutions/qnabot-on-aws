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

exports.s3BucketObject = function() {
    const response = {
        Bucket: 'mock_bucket',
        Prefix: 'mock_prefix',
    }

    return response;
}

exports.listObjectVersionsCommandObject = function() {
    const response = {
        Versions: [ 
            {
                Key: 'mock_version_key_1',
                VersionId: 'mock_version_id_1'
            }
        ],
        DeleteMarkers: [ 
            {
                Key: 'mock_delete_marker_key_1',
                VersionId: 'mock_version_id_1'
            }
        ]
    }

    return response;
}

exports.deleteObjectsCommandObject = function() { 
    const response = {
        $metadata: 
        { 
            httpStatusCode: 'mock_status_code' 
        }
    }

    return response;
}