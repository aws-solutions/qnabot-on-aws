/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = Object.assign(
    require('./bot'),
    require('./health'),
    require('./root'),
    require('./qa'),
    require('./proxy'),
    require('./login'),
    require('./jobs'),
    require('./examples'),
    require('./services'),
    require('./images'),
);
