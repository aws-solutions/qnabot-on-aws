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

var aws=require('./util/aws')
var Promise=require('./util/promise')
var index=".kibana"

module.exports=function(params){
    var con=(require('./connection.js'))(params.address)

    return con.tap(createIndex).tap(function(es){
        return Promise.join(
            createMapping(es,"index-pattern"),        
            createMapping(es,"config"),        
            createMapping(es,"visualization"),        
            createMapping(es,"search"),
            createMapping(es,"dashboard"),
            createMapping(es,"server")
        )
    }).tap(()=>console.log("created mappings"))
    .tap(x=>x[0].indices.refresh())
    .then(function(es){
        return Promise.all(
            documents.concat(require('./config'))
            .map(document=>putDocument(es,document))
        )
    }).tap(()=>console.log("put files"))
}

var createIndex=function(es){
    return es.indices.exists({
        index:index
    })
    .tap(exists=>console.log('index '+index+' exists:'+exists))
    .tap(function(exists){ 
        return !exists ? es.indices.create({
            index:index
        }) : null
    })
    .tap(()=>console.log('index created'))
    .tapCatch(()=>console.log('index failed'))
}

var createMapping=function(es,type){
    return es.indices.existsType({
        index:index,
        type:type
    })
    .tap(exists=>console.log('type '+type+' exists'))
    .tap(function(exists){ 
        var body={}
        if(!exists){
            body[type]=require('./mappings')[type]
            return es.indices.putMapping({
                index:index,
                type:type,
                body:body
            })
        }
    })
    .tap(()=>console.log('type:'+type+' created'))
    .tapCatch(()=>console.log('type:'+type+' failed'))
}

var putDocument=function(es,document){
    console.log("creating "+document._id+' '+document._type)
    var param={
        index:index,
        type:document._type,
        id:document._id,
        body:document._source
    }
    return es.index(param)
        .then(()=>console.log(document._id+' '+document._type+' created'))
}







