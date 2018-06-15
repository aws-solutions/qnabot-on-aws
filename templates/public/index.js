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

var Promise=require('bluebird')
var fs=Promise.promisifyAll(require('fs'))
var _=require('lodash')
var path=require('path')

var config=require('../../config')
module.exports=Promise.resolve(require('../master')).then(function(base){
    base.Outputs=_.pick(base.Outputs,[
        "ContentDesignerURL",
        "ClientURL",
        "DashboardURL",
        "UserPoolURL",
        "BotName",
        "BotAlias",
        "Intent"
    ])

    base.Parameters=_.pick(base.Parameters,[
        "Email",
        "Username"
    ])
    base.Conditions.Public={"Fn::Equals":[true,true]}
    base.Conditions.AdminSignUp={"Fn::Equals":[true,true]}
    base.Conditions.Domain={"Fn::Equals":[true,false]}
    base.Conditions.BuildExamples={"Fn::Equals":[true,true]}
    base.Conditions.CreateDomain={"Fn::Equals":[true,true]}
    base.Conditions.DontCreateDomain={"Fn::Equals":[true,false]}
    
    var out=JSON.stringify(base).replace(
        /{"Ref":"BootstrapBucket"}/g,
        '"'+config.publicBucket+'"')
    
    out=out.replace(
        /{"Ref":"ElasticsearchName"}/g,
        '"EMPTY"')

    out=out.replace(
        /{"Ref":"ApprovedDomain"}/g,
        '"EMPTY"')

    out=out.replace(
        /\${BootstrapPrefix}/g,
        ''+config.publicPrefix+'')

    out=out.replace(
        /\${BootstrapBucket}/g,
        ''+config.publicBucket+'')

    out=out.replace(
        /{"Ref":"BootstrapPrefix"}/g,
        '"'+config.publicPrefix+'"')

    return JSON.parse(out)
})
