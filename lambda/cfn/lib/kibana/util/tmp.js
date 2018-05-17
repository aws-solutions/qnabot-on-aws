/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var address="search-vmware-domain-qra5krt1ek97-36yada5rnfz2j2wzeg23rmxwmq.us-west-2.es.amazonaws.com"
process.env.AWS_REGION='us-west-2'
var con=require('../lib/con')(address)

con.then(function(es){
    es.indices.getMapping({
        index:".kibana"
    })

    es.search({
        index:".kibana",
        body:{
            "query" : {
                "match_all" : {}
            }
        }
    }).tap(x=>console.log(JSON.stringify(x,null,2)))
})
