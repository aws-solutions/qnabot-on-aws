/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

// Manual mock for @smithy/uuid to fix Jest compatibility issues
module.exports = {
    randomUUID: () => 'test-uuid-12345'
};