/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var lambda=require('./setup.js')
var outputs=require('../../../bin/exports')
var Promise=require('bluebird')
var run=function(params,test){
    return lambda(params)
        .tap(msg=>console.log(JSON.stringify(msg)))
        .tap(test.ok)
        .error(test.ifError)
        .catch(test.ifError)
        .finally(test.done)
}

module.exports={
    build:function(test){
        outputs('dev/master',{wait:true})
        .then(function(master){
            var params={
                address:master.ElasticSearchEndpoint,
                index:master.ElasticSearchIndex,
                type:master.ElasticSearchType,
                botname:master.BotName,
                slottype:master.SlotType,
                intent:master.IntentName
            }
            run(params,test)
        })
    }
}


