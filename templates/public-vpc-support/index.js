#! /usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
        "LexV1BotName",
        "LexV1BotAlias",
        "LexV1Intent",
        "LexV1IntentFallback",
        "LexV2BotName",
        "LexV2BotId",
        "LexV2BotAlias",
        "LexV2BotAliasId",
        "LexV2Intent",
        "LexV2IntentFallback",
        "LexV2BotLocaleIds",
        "FeedbackSNSTopic",
        "ESProxyLambda",
        "ElasticsearchEndpoint",
        "ElasticsearchIndex"
    ])
    base.Parameters=_.pick(base.Parameters,[
        "Email",
        "Username",
        "DefaultKendraIndexId",
        "Encryption",
        "PublicOrPrivate",
        "LexV2BotLocaleIds",
        "LexBotVersion",
        "FulfillmentConcurrency",
        "ElasticSearchNodeCount",
        "KibanaDashboardRetentionMinutes",
        "VPCSubnetIdList",
        "VPCSecurityGroupIdList",
        "XraySetting"
    ]);
    base.Metadata = {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                   "Label": {
                        "default": "Authentication"
                   },
                   "Parameters": [
                        "Email",
                        "Username",
                        "PublicOrPrivate"
                   ]
                },
                {
                   "Label": {
                        "default": "VPC"
                   },
                   "Parameters": [
                        "VPCSubnetIdList",
                        "VPCSecurityGroupIdList"
                   ]
                },
                {
                   "Label": {
                        "default": "Amazon Kendra Integration"
                   },
                   "Parameters": [
                        "DefaultKendraIndexId"
                   ]
                },
                {
                   "Label": {
                        "default": "Amazon OpenSearch Service"
                   },
                   "Parameters": [
                        "ElasticSearchNodeCount",
                        "Encryption",
                        "KibanaDashboardRetentionMinutes"
                   ]
                },
                {
                   "Label": {
                        "default": "Amazon LexV2"
                   },
                   "Parameters": [
                        "LexV2BotLocaleIds"
                   ]
                }
            ]
        }
    };
    base.Conditions.Public={"Fn::Equals":[{"Ref":"PublicOrPrivate"},"PUBLIC"]}
    base.Conditions.Encrypted={"Fn::Equals":[{"Ref":"Encryption"},"ENCRYPTED"]}
    base.Conditions.AdminSignUp={"Fn::Equals":[true,true]}
    base.Conditions.Domain={"Fn::Equals":[true,false]}
    base.Conditions.BuildExamples={"Fn::Equals":[true,true]}
    base.Conditions.CreateDomain={"Fn::Equals":[true,true]}
    base.Conditions.DontCreateDomain={"Fn::Equals":[true,false]}
    base.Conditions.VPCEnabled={ "Fn::Not": [
            { "Fn::Equals": [ "",
                    { "Fn::Join": [ "", { "Ref": "VPCSecurityGroupIdList" } ] }
                ] }
        ] }

    var out=JSON.stringify(base);

    if(config.buildType == 'AWSSolutions') {
        out=out.replace(
            /{"Ref":"BootstrapBucket"}/g,
            '{"Fn::Sub": "'+config.publicBucket+'-${AWS::Region}"}');
        out=out.replace(
            /\${BootstrapBucket}/g,
            ''+config.publicBucket+'-${AWS::Region}');
    } else {
        out=out.replace(
            /{"Ref":"BootstrapBucket"}/g,
            '"'+config.publicBucket+'"');
        out=out.replace(
            /\${BootstrapBucket}/g,
            ''+config.publicBucket+'');
    }

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
        /{"Ref":"BootstrapPrefix"}/g,
        '"'+config.publicPrefix+'"')

    // The next two replaces are order dependent. Keep in this order.
    out=out.replace(
        /CommaDelimitedList/, "List<AWS::EC2::Subnet::Id>")
    out=out.replace(
        /CommaDelimitedList/, "List<AWS::EC2::SecurityGroup::Id>")

    return JSON.parse(out)
})
