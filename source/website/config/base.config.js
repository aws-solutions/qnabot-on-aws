/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
const path = require('path');
const {VueLoaderPlugin} = require('vue-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const webpack = require('webpack');

module.exports={
    entry:{
        main:['./entry.js'],
        check:['./js/browser-check.js'],
        client:['./js/client.js'],
        test:['./js/test.js'],
    },
    output:{
        path:path.join(__dirname,'../build'),
        filename:'[name].js',
        chunkFilename: '[name].js', 
    },
    plugins:[
        new VueLoaderPlugin(),
        new NodePolyfillPlugin(),
        new CopyWebpackPlugin({ patterns: [{from:'./assets',to:'assets'}] }),
        new CopyWebpackPlugin({ patterns: [{from:'./styles',to:'styles'}] }),
        new CopyWebpackPlugin({ patterns: [{
            from:'../node_modules/aws-lex-web-ui/dist/wav-worker.min.js',
            to:'wav-worker.js'
        }]}),
        new HtmlWebpackPlugin({
            template:'./html/admin.pug',
            filename:'index.html',
            chunks:['main','check', 'vendor'],
        }),
        new HtmlWebpackPlugin({
            template:'./html/test.ejs',
            filename:'test.html',
            chunks:['main','test','check'],
        }),
        new HtmlWebpackPlugin({
            template:'./html/client.pug',
            filename:'client.html',
            chunks:['client', 'vendor'],
        }),
        new HtmlWebpackPlugin({
            filename:'health.html',
            templateContent:'ok\n',
            inject:false
        }),
        new TerserPlugin({
            terserOptions: {
                output: {
                    ascii_only: true
                }
            }
        }),
        new webpack.DefinePlugin({
            __VUE_PROD_DEVTOOLS__: JSON.stringify(true),
            __VUE_OPTIONS_API__: JSON.stringify(true),
        })
    ],
    resolve: {
        modules: [path.resolve(__dirname, '../../'), 'node_modules'],
        extensions: [ '.js', '.vue', '.pug', '.styl', '.scss', '.css' ],
        alias: {
            handlebars: 'handlebars/dist/handlebars.min.js',
            Vue: 'vue',
            Vuex: 'vuex',
            Vuetify: 'vuetify',
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: [
                    /node_modules/,
                    /__tests__/,
                ],
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env']
                }
            },
            {
                test: /\.(md|txt)$/,
                type: 'asset/source'
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.(png|eot|ttf|svg)$/,
                type: 'asset/resource'
            },
            {
                test: /\.(woff|woff2)$/,
                type: 'asset/resource',
                generator : {
                    filename : './fonts/[name][ext]'
                }
            },
            {
                test: /\.pug$/,
                oneOf: [
                    {
                        resourceQuery: /^\?vue/,
                        use: ['pug-plain-loader'],
                    },
                    {
                        type: 'asset/source',
                        loader: 'pug-plain-loader'
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.styl$/,
                use: ['style-loader','css-loader','stylus-loader']
            },

            {
                test: /\.scss$/,
                use:['style-loader', 'css-loader', 'sass-loader']
            }
        ]
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    optimization: {
        splitChunks: {
            cacheGroups: {
                'vendor-aws-sdk': {
                    name: 'vendor-aws-sdk',
                    test: /[\\/]node_modules[\\/]aws-sdk/,
                    chunks: 'initial',
                    idHint: 'vendor-aws-sdk',
                },
                'vendor-aws-lex-web-ui': {
                    name: 'vendor-aws-lex-web-ui',
                    test: /[\\/]node_modules[\\/]aws-lex-web-ui/,
                    chunks: 'initial',
                    idHint: 'aws-lex-web-ui',
                },
                'vendor-vue-vuetify': {
                    name: 'vendor-vue-vuetify',
                    test: /[\\/]node_modules[\\/](vuetify|vue)/,
                    chunks: 'initial',
                    idHint: 'vendor-vue-vuetify',
                }

            }
        }
    },
}
