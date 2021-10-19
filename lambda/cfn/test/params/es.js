// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var base=require('./base')
var Promise=require('bluebird')
var aws=require('../../lib/util/aws')
var s3=new aws.S3()
var outputs=require('../../../../bin/exports')

var setup=outputs('dev/domain').then(function(output){
    return {
        Address:output.Addresss,
        Index:'test-index',
        Name:'test-index-2',
        Type:{    
            _meta:{
                test:"a"
            },
            properties:{
                qid:{type:"keyword"}
            }
        }
    }
})

exports.create=()=>params("Create")
exports.update=()=>params("Update")
exports.delete=()=>params("Delete")

function params(stage){
    return setup.then(param=>base("EsInit",stage,param))
}


