/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = Object.assign(
    require('./es'),
    require('./info'),
    require('./firehose'),
    require('./proxy'),
    require('./updates')
);
