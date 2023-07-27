#! /usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')
var _=require('lodash')

var config=require('../../config.json')
module.exports=Promise.resolve(require('../master')).then(function(base){
    // customize description
    base.Description = `(SO0189) QnABot with admin and client websites - Version v${process.env.npm_package_version}`;

    base.Outputs=_.pick(base.Outputs,[
        'ContentDesignerURL',
        'ClientURL',
        'DashboardURL',
        'UserPoolURL',
        'LexV1BotName',
        'LexV1BotAlias',
        'LexV1Intent',
        'LexV1IntentFallback',
        'LexV2BotName',
        'LexV2BotId',
        'LexV2BotAlias',
        'LexV2BotAliasId',
        'LexV2Intent',
        'LexV2IntentFallback',
        'LexV2BotLocaleIds',
        'FeedbackSNSTopic',
        'ESProxyLambda',
        'ElasticsearchEndpoint',
        'ElasticsearchIndex',
        'MetricsBucket'
    ])
    base.Parameters=_.pick(base.Parameters,[
        'Email',
        'Username',
        'DefaultKendraIndexId',
        'Encryption',
        'ElasticSearchNodeCount',
        'ElasticSearchEBSVolumeSize',
        'KibanaDashboardRetentionMinutes',
        'PublicOrPrivate',
        'LexV2BotLocaleIds',
        'LexBotVersion',
        'InstallLexResponseBots',
        'FulfillmentConcurrency',
        'XraySetting',
        'EmbeddingsApi',
        'SagemakerInitialInstanceCount',
        'EmbeddingsLambdaArn',
        'EmbeddingsLambdaDimensions',
        'LLMApi',
        'LLMSagemakerInstanceType',
        'LLMSagemakerInitialInstanceCount',
        'LLMLambdaArn'
    ]);
    base.Metadata = {
        'AWS::CloudFormation::Interface': {
            'ParameterGroups': [
                {
                    'Label': {
                        'default': 'Authentication'
                    },
                    'Parameters': [
                        'Email',
                        'Username',
                        'PublicOrPrivate'
                    ]
                },
                {
                    'Label': {
                        'default': 'Amazon Kendra Integration'
                    },
                    'Parameters': [
                        'DefaultKendraIndexId'
                    ]
                },
                {
                    'Label': {
                        'default': 'Amazon OpenSearch Service'
                    },
                    'Parameters': [
                        'ElasticSearchNodeCount',
                        'ElasticSearchEBSVolumeSize',
                        'Encryption',
                        'KibanaDashboardRetentionMinutes'
                    ]
                },
                {
                    'Label': {
                        'default': 'Amazon LexV2'
                    },
                    'Parameters': [
                        'LexV2BotLocaleIds'
                    ]
                },
                {
                    'Label': {
                        'default': 'Semantic Search with Embeddings'
                    },
                    'Parameters': [
                        'EmbeddingsApi',
                        'SagemakerInitialInstanceCount',
                        'EmbeddingsLambdaArn',
                        'EmbeddingsLambdaDimensions'
                    ]
                },
                {
                    'Label': {
                        'default': 'LLM integration for contextual followup and generative answers'
                    },
                    'Parameters': [
                        'LLMApi',
                        'LLMSagemakerInstanceType',
                        'LLMSagemakerInitialInstanceCount',
                        'LLMLambdaArn'
                    ]
                },
                {
                    'Label': {
                        'default': 'Miscellaneous'
                    },
                    'Parameters': [
                        'LexBotVersion',
                        'InstallLexResponseBots',
                        'FulfillmentConcurrency',
                        'XraySetting'
                    ]
                }
            ]
        }
    };
    base.Conditions.Public={'Fn::Equals':[{'Ref':'PublicOrPrivate'},'PUBLIC']}
    base.Conditions.Encrypted={'Fn::Equals':[{'Ref':'Encryption'},'ENCRYPTED']}
    base.Conditions.AdminSignUp={'Fn::Equals':[true,true]}
    base.Conditions.Domain={'Fn::Equals':[true,false]}
    base.Conditions.BuildExamples={'Fn::Equals':[true,true]}
    base.Conditions.CreateDomain={'Fn::Equals':[true,true]}
    base.Conditions.DontCreateDomain={'Fn::Equals':[true,false]}
    base.Conditions.VPCEnabled={'Fn::Equals':[true,false]}
    base.Conditions.SingleNode={'Fn::Equals':[{'Ref':'ElasticSearchNodeCount'},'1']}
    base.Conditions.EmbeddingsEnable={'Fn::Not': [{ 'Fn::Equals':[{'Ref':'EmbeddingsApi'},'DISABLED']}]}
    base.Conditions.EmbeddingsSagemaker={'Fn::Equals':[{'Ref':'EmbeddingsApi'},'SAGEMAKER']}
    base.Conditions.EmbeddingsLambda={'Fn::Equals':[{'Ref':'EmbeddingsApi'},'LAMBDA']}
    base.Conditions.EmbeddingsLambdaArn={'Fn::Not': [{ 'Fn::Equals':[{'Ref':'EmbeddingsLambdaArn'},'']}]}

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

    out=out.replace(
        /{"Ref":"VPCSubnetIdList"}/g,
        '[{"Ref":"AWS::NoValue"}]')

    out=out.replace(
        /{"Ref":"VPCSecurityGroupIdList"}/g,
        '[{"Ref":"AWS::NoValue"}]')

    return JSON.parse(out)
})

// "VPCSubnetIdList" : { "Fn::Join" : [ ",", {"Ref":"VPCSubnetIdList"} ] }
