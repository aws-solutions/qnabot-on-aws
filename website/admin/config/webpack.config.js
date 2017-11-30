/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
var config=require('../../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.profile

var path=require('path')
var ArchivePlugin = require('webpack-archive-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var LodashModuleReplacementPlugin = require('lodash-webpack-plugin');
var FaviconPlugin=require('favicons-webpack-plugin')
var S3Plugin = require('webpack-s3-plugin')
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
var webpack=require('webpack')
var _=require('lodash')
var aws=require('aws-sdk')
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    filename: "[name].css",
    disable: process.env.NODE_ENV === "development"
});

module.exports = require('../../../bin/exports')(config.region).then(function(result){
    return {
    watch: process.env.WATCH ? true : false,
    watchOptions:{
        aggregateTimeout:500
    },
    entry:{
        main:"./website/admin/entry.js",
        check:"./website/admin/js/browser-check.js",
        client:"./website/admin/js/client.js",
        test:"./website/admin/js/test.js",
        vendor:["bluebird","lodash","vue","aws-sdk"]
    },
    output:{
        path:path.join(__dirname,'../build'),
        filename:"[name].js",
        chunkFilename: '[name].js', 
    },
    plugins:_.compact([
        process.env.WATCH ? new BundleAnalyzerPlugin() : null,
        process.env.UPLOAD ? new S3Plugin({
            s3Options: {
                accessKeyId:aws.config.credentials.accesskeyId,
                secretAccessKey:aws.config.credentials.secretAccessKey,
                region:config.region
            },
            s3UploadOptions:{
                Bucket:result["QNA-DEV-WEB-BUCKET"]
            }
        }) : null,
        new ProgressBarPlugin(),
        new ArchivePlugin({
            output:"build/website",
            format:"zip"
        }),
        new webpack.optimize.CommonsChunkPlugin({
            name:'vendor'
        }),
        extractSass,
        new CopyWebpackPlugin([{from:'./website/admin/assets',to:"assets"}]),
        new CopyWebpackPlugin([{
            from:'./node_modules/aws-lex-web-ui/dist/wav-worker.min.js',
            to:"wav-worker.js"
        }]),
        new HtmlWebpackPlugin({
            template:'./website/admin/html/admin.pug',
            filename:'index.html',
            chunks:["main","check","vendor"]
        }),
        new HtmlWebpackPlugin({
            template:'./website/admin/html/test.ejs',
            filename:'test.html',
            chunks:["main","test","check"]
        }),
        new HtmlWebpackPlugin({
            template:'./website/admin/html/client.pug',
            filename:'client.html',
            chunks:["client","vendor"]
        }),
        new HtmlWebpackPlugin({
            filename:"health.html",
            templateContent:"ok\n",
            inject:false
        })
    ]),
    resolve:{
        alias:{
            vue$:'vue/dist/vue.js',
            handlebars: 'handlebars/dist/handlebars.min.js',
            querystring: 'querystring-browser'
        }
    },
    module: {
        rules: [
          {
            test: /\.md$/,
            loader: 'raw-loader'
          },
          {
            test: /\.vue$/,
            loader: 'vue-loader',
            options: {
              loaders: {
                'scss': 'vue-style-loader!css-loader!sass-loader',
                'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
              }
            }
          },
          { 
            test: /\.(png|woff|woff2|eot|ttf|svg)$/, 
            loader: 'url-loader?limit=100000' 
          },
          {
            test: /\.pug$/,
            loader: 'pug-loader'
          },
          {
            test: /\.css$/,
            use: ['style-loader','css-loader']
          },
          {
            test: /\.scss$/,
            use: extractSass.extract({
                use:[
                    {loader: "css-loader" }, 
                    {loader: "sass-loader" }
                ]
            })
          }
        ]
    }
    }
})
