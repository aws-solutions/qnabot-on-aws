/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const ZipPlugin = require('zip-webpack-plugin');
module.exports = {
    mode: 'production',
    plugins:[
        new ZipPlugin({
            path: '../../build',
            filename: 'website.zip',
        })
    ]
}

        
