#! /usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')
var fs=Promise.promisifyAll(require('fs'))
var _=require('lodash')
var path=require('path')

var config=require('../../config')
module.exports=Promise.resolve(require('../master')).then(function(base){
    // customize description
    base.Description = `(SO0189-vpc) QnABot with admin and client websites - (Version v${process.env.npm_package_version})`;

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
        'ElasticsearchIndex'
    ])
    base.Parameters=_.pick(base.Parameters,[
        'Email',
        'Username',
        'DefaultKendraIndexId',
        'Encryption',
        'PublicOrPrivate',
        'LexV2BotLocaleIds',
        'LexBotVersion',
        'InstallLexResponseBots',
        'FulfillmentConcurrency',
        'ElasticSearchNodeCount',
        'KibanaDashboardRetentionMinutes',
        'VPCSubnetIdList',
        'VPCSecurityGroupIdList',
        'XraySetting',
        'EmbeddingsApi',
        'EmbeddingsSagemakerEndpoint',
        'SagemakerInitialInstanceCount',
        'EmbeddingsLambdaArn',
        'EmbeddingsLambdaDimensions',
        'LLMApi',
        'LLMSagemakerInitialInstanceCount',
        'LLMLambdaArn',
        'LLMThirdPartyApiKey'
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
                        'default': 'VPC'
                    },
                    'Parameters': [
                        'VPCSubnetIdList',
                        'VPCSecurityGroupIdList'
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
                        'EmbeddingsSagemakerEndpoint',
                        'EmbeddingsLambdaArn',
                        'EmbeddingsLambdaDimensions',
                        'SagemakerInitialInstanceCount'
                    ]
                },
                {
                    'Label': {
                        'default': 'LLM integration for contextual followup and generative answers'
                    },
                    'Parameters': [
                        'LLMApi',
                        'LLMSagemakerInitialInstanceCount',
                        'LLMLambdaArn',
                        'LLMThirdPartyApiKey'
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
    base.Conditions.VPCEnabled={ 'Fn::Not': [
        { 'Fn::Equals': [ '',
            { 'Fn::Join': [ '', { 'Ref': 'VPCSecurityGroupIdList' } ] }
        ] }
    ] }
    base.Conditions.EmbeddingsEnable={'Fn::Not': [{ 'Fn::Equals':[{'Ref':'EmbeddingsApi'},'DISABLED']}]}
    base.Conditions.EmbeddingsSagemaker={'Fn::Equals':[{'Ref':'EmbeddingsApi'},'SAGEMAKER']}
    base.Conditions.EmbeddingsLambda={'Fn::Equals':[{'Ref':'EmbeddingsApi'},'LAMBDA']}
    base.Conditions.EmbeddingsLambdaArn={'Fn::Not': [{ 'Fn::Equals':[{'Ref':'EmbeddingsLambdaArn'},'']}]}
    base.Conditions.EmbeddingsBedrock={"Fn::Equals":[{"Ref":"EmbeddingsApi"},"BEDROCK"]}
    base.Conditions.LLMEnable={'Fn::Not': [{ 'Fn::Equals':[{'Ref':'LLMApi'},'DISABLED']}]}
    base.Conditions.LLMSagemaker={'Fn::Or': [{'Fn::Equals':[{'Ref':'LLMApi'},'SAGEMAKER']}, {'Fn::Equals':[{'Ref':'LLMApi'},'ALL']}]}
    base.Conditions.LLMLambda={'Fn::Or': [{'Fn::Equals':[{'Ref':'LLMApi'},'LAMBDA']}, {'Fn::Equals':[{'Ref':'LLMApi'},'ALL']}]}
    base.Conditions.LLMLambdaArn={'Fn::Not': [{ 'Fn::Equals':[{'Ref':'LLMLambdaArn'},'']}]}
    base.Conditions.LLMAnthropic={'Fn::Or': [{'Fn::Equals':[{'Ref':'LLMApi'},'ANTHROPIC']}, {'Fn::Equals':[{'Ref':'LLMApi'},'ALL']}]}
    base.Conditions.LLMThirdPartyApiKey={'Fn::Not': [{ 'Fn::Equals':[{'Ref':'LLMThirdPartyApiKey'},'']}]}
    base.Conditions.LLMBedrock={'Fn::Or': [{'Fn::Equals':[{'Ref':'LLMApi'},'BEDROCK']}, {'Fn::Equals':[{'Ref':'LLMApi'},'BEDROCK']}]}
    base.Conditions.Bedrock={'Fn::Or': [{'Condition':'EmbeddingsBedrock'},{'Condition':'LLMBedrock'}]}
    
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
        /CommaDelimitedList/, 'List<AWS::EC2::Subnet::Id>')
    out=out.replace(
        /CommaDelimitedList/, 'List<AWS::EC2::SecurityGroup::Id>')

    return JSON.parse(out)
})
