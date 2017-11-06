/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var path=require('path')
var ArchivePlugin = require('webpack-archive-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var UglifyJSPlugin = require('uglifyjs-webpack-plugin');
var FaviconPlugin=require('favicons-webpack-plugin')

const ExtractTextPlugin = require("extract-text-webpack-plugin");

const extractSass = new ExtractTextPlugin({
    filename: "[name].css",
    disable: process.env.NODE_ENV === "development"
});

module.exports={
    entry:{
        main:"./website/admin/entry.js",
        check:"./website/admin/js/browser-check.js",
        client:"./website/admin/js/client.js",
        test:"./website/admin/js/test.js"
    },
    output:{
        path:path.join(__dirname,'../build'),
        filename:"[name].js",
        chunkFilename: '[name]-[chunkhash].js', 
    },
    plugins:[
        new ArchivePlugin({
            output:"build/website",
            format:"zip"
        }),
        new FaviconPlugin({
            logo:'./website/admin/assets/robot.png',
            prefix:'assets/favicon/',
            title:'QnABot Designer',
            icons:{
                android: false,
                appleIcon: false,
                appleStartup: false,
                coast: false,
                favicons: true,
                firefox: false,
                opengraph: false,
                twitter: false,
                yandex: false,
                windows: false
            }
        }),
        extractSass,
        new CopyWebpackPlugin([{from:'./website/admin/assets',to:"assets"}]),
        new CopyWebpackPlugin([{
            from:'./node_modules/aws-lex-web-ui/dist/wav-worker.min.js',
            to:"wav-worker.js"
        }]),
        new HtmlWebpackPlugin({
            template:'./website/admin/html/admin.ejs',
            favicon:"./website/admin/assets/favicon.gif",
            filename:'index.html',
            chunks:["main","check"]
        }),
        new HtmlWebpackPlugin({
            template:'./website/admin/html/test.ejs',
            filename:'test.html',
            favicon:"./website/admin/assets/favicon.gif",
            chunks:["main","test","check"]
        }),
        new HtmlWebpackPlugin({
            template:'./website/admin/html/client.ejs',
            filename:'client.html',
            inject:false
        }),
        new HtmlWebpackPlugin({
            filename:"health.html",
            templateContent:"ok\n",
            inject:false
        })
    ],
    resolve:{
        alias:{
            vue$:'vue/dist/vue.js',
            handlebars: 'handlebars/dist/handlebars.min.js'
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
            options: {}
          },
          {
            test: /\.js$/,
            loader: 'babel-loader',
            options:{
                presets:["es2015-ie"]
            }
          },
          { 
            test: /\.(png|woff|woff2|eot|ttf|svg)$/, 
            loader: 'url-loader?limit=100000' 
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
