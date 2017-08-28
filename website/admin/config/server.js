#! /usr/bin/env node
/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var WebpackDevServer = require("webpack-dev-server");
var webpack = require("webpack");
var port=8000
var compiler=webpack(require('./webpack.config.js'))
var mock=require('../../mock')

var server = new WebpackDevServer(compiler, {
    contentBase: "website/admin/build",
    setup:function(app){
        mock(app)
    }
})
server.listen(port, "localhost", function() {
    console.log("Listening on port:"+port)
});

