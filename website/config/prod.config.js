// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var ArchivePlugin = require('webpack-archive-plugin');
module.exports = {
    resolve:{
        alias:{
            vue$:'vue/dist/vue.js'
        }
    },
    plugins:[
        new ArchivePlugin({
            output:"../build/website",
            format:"zip"
        })
    ]
}

        
