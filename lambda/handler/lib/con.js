/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var AWS = require('./aws.js');
var myCredentials = new AWS.EnvironmentCredentials('AWS'); 

module.exports=function(){
    return require('elasticsearch').Client({
        hosts: process.env.ES_ADDRESS,
        connectionClass: require('http-aws-es'),
        defer: function () {
            return Promise.defer();
        },
        amazonES: {
            region: process.env.REGION,
            credentials: myCredentials
        }
    })
}
