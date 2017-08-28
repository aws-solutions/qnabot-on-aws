/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var mock=require('../../../mock')

module.exports = function(config) {
  config.set({
    basePath: '',
    frameworks: ['mocha','express-http-server','chai'],
    files: [
        {pattern:"assets/sdk/*.js",included:true,served:true},
        {pattern:"specs/*.spec.js",watched: false, served: true, included: true }
    ],
    proxies:{
        '/api':'http://localhost:8000/api'
    },
    exclude: [],
    preprocessors: {
        "specs/*.spec.js":["webpack","coverage"]
    },
    webpack:{
    },
    webpackMiddleware: {
        noInfo: true,
    },
    reporters: ['mocha',"coverage"],
    port: 8000,
    colors: true,
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    autoWatch: true,
    autoWatchBatchDelay:1000,
    singleRun: false,
    browsers: ['ChromeHeadless'],
    // if true, Karma captures browsers, runs the tests and exits
    concurrency: Infinity,
    expressHttpServer: {
        port: 8000,
        appVisitor: function (app, log) {
            log.info('Visiting');
            mock(app)
        }
    },
    plugins:[
        'karma-express-http-server',
        'karma-webpack',
        'karma-coverage',
        'karma-mocha',
        'karma-mocha-reporter',
        'karma-chrome-launcher',
        'karma-chai']
  })
}
