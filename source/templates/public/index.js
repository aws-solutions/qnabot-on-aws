#! /usr/bin/env node
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

const _ = require('lodash');

const config = require('../../config.json');
module.exports = Promise.resolve(require('../master')).then((base) => {
    // customize description
    base.Description = `(SO0189) QnABot with admin and client websites - Version v${process.env.npm_package_version}`;

    base.Outputs = _.pick(base.Outputs, [
        'ContentDesignerURL',
        'ClientURL',
        'CloudWatchDashboardURL',
        'UserPoolURL',
        'LexV2BotName',
        'LexV2BotId',
        'LexV2BotAlias',
        'LexV2BotAliasId',
        'LexV2Intent',
        'LexV2IntentFallback',
        'LexV2BotLocaleIds',
        'FeedbackSNSTopic',
        'ESProxyLambda',
        'OpenSearchDomainEndpoint',
        'OpenSearchIndex',
        'MetricsBucket',
        'TestAllBucket',
        'ContentDesignerOutputBucket',
        'StreamingWebSocketEndpoint',
        'SettingsTable'
    ]);
    base.Parameters = _.pick(base.Parameters, [
        'Email',
        'Username',
        'KendraWebPageIndexId',
        'KendraFaqIndexId',
        'AltSearchKendraIndexes',
        'AltSearchKendraIndexAuth',
        'OpenSearchNodeCount',
        'OpenSearchInstanceType',
        'OpenSearchEBSVolumeSize',
        'OpenSearchDashboardsRetentionMinutes',
        'OpenSearchFineGrainAccessControl',
        'PublicOrPrivate',
        'Language',
        'LexV2BotLocaleIds',
        'LexBotVersion',
        'InstallLexResponseBots',
        'FulfillmentConcurrency',
        'XraySetting',
        'EmbeddingsApi',
        'EmbeddingsBedrockModelId',
        'EmbeddingsLambdaArn',
        'EmbeddingsLambdaDimensions',
        'LLMApi',
        'LLMBedrockModelId',
        'LLMLambdaArn',
        'BedrockKnowledgeBaseId',
        'BedrockKnowledgeBaseModel',
        'LogRetentionPeriod',
        'EnableStreaming',
    ]);
    base.Metadata = {
        'AWS::CloudFormation::Interface': {
            ParameterGroups: [
                {
                    Label: {
                        default: 'Step 2A: Set Basic Chatbot Parameters (required)',
                    },
                    Parameters: [
                        'Email',
                        'Username',
                        'PublicOrPrivate',
                        'Language',
                        'OpenSearchInstanceType',
                        'OpenSearchNodeCount',
                        'OpenSearchEBSVolumeSize',
                        'OpenSearchDashboardsRetentionMinutes',
                        'OpenSearchFineGrainAccessControl',
                        'LexV2BotLocaleIds',
                        'LexBotVersion',
                        'InstallLexResponseBots',
                        'FulfillmentConcurrency',
                        'XraySetting',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2B: Enable LLM for Semantic Search with Embeddings (optional)',
                    },
                    Parameters: [
                        'EmbeddingsApi',
                        'EmbeddingsBedrockModelId',
                        'EmbeddingsLambdaArn',
                        'EmbeddingsLambdaDimensions',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2C: Enable LLM Retrieval and generative text question answering to use with Fallback Option (optional)',
                    },
                    Parameters: [
                        'LLMApi',
                        'LLMBedrockModelId',
                        'LLMLambdaArn',
                        'EnableStreaming',
                    ],
                },
                {
                    Label: {
                        default: 'Step 2D: Select Data Sources as Fallback Option (optional)',
                    },
                    Parameters: [
                        'KendraWebPageIndexId',
                        'KendraFaqIndexId',
                        'AltSearchKendraIndexes',
                        'BedrockKnowledgeBaseId',
                        'BedrockKnowledgeBaseModel',
                    ],
                },
            ],
        },
    };
    base.Conditions.Public = { 'Fn::Equals': [{ Ref: 'PublicOrPrivate' }, 'PUBLIC'] };
    base.Conditions.AdminSignUp = { 'Fn::Equals': [true, true] };
    base.Conditions.FGACEnabled = { 'Fn::Equals': [true, true ] };
    base.Conditions.Domain = { 'Fn::Equals': [true, false] };
    base.Conditions.BuildExamples = { 'Fn::Equals': [true, true] };
    base.Conditions.CreateDomain = { 'Fn::Equals': [true, true] };
    base.Conditions.DontCreateDomain = { 'Fn::Equals': [true, false] };
    base.Conditions.VPCEnabled = { 'Fn::Equals': [true, false] };
    base.Conditions.SingleNode = { 'Fn::Equals': [{ Ref: 'OpenSearchNodeCount' }, '1'] };
    base.Conditions.BedrockEnable = { 'Fn::Or': [{ 'Fn::Equals': [{ Ref: 'LLMApi' }, 'BEDROCK'] }, { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'BEDROCK'] }] };
    base.Conditions.EmbeddingsEnable = { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'DISABLED'] }] };
    base.Conditions.EmbeddingsBedrock = { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'BEDROCK'] };
    base.Conditions.EmbeddingsLambda = { 'Fn::Equals': [{ Ref: 'EmbeddingsApi' }, 'LAMBDA'] };
    base.Conditions.EmbeddingsLambdaArn = { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'EmbeddingsLambdaArn' }, ''] }] };

    let out = JSON.stringify(base);

    if (config.buildType == 'AWSSolutions') {
        out = out.replace(
            /{"Ref":"BootstrapBucket"}/g,
            `{"Fn::Sub": "${config.publicBucket}-\${AWS::Region}"}`,
        );
        out = out.replace(
            /\${BootstrapBucket}/g,
            `${config.publicBucket}-\${AWS::Region}`,
        );
    } else {
        out = out.replace(
            /{"Ref":"BootstrapBucket"}/g,
            `"${config.publicBucket}"`,
        );
        out = out.replace(
            /\${BootstrapBucket}/g,
            `${config.publicBucket}`,
        );
    }

    out = out.replace(
        /{"Ref":"OpenSearchName"}/g,
        '"EMPTY"',
    );

    out = out.replace(
        /{"Ref":"ApprovedDomain"}/g,
        '"EMPTY"',
    );

    out = out.replace(
        /\${BootstrapPrefix}/g,
        `${config.publicPrefix}`,
    );

    out = out.replace(
        /{"Ref":"BootstrapPrefix"}/g,
        `"${config.publicPrefix}"`,
    );

    out = out.replace(
        /{"Ref":"VPCSubnetIdList"}/g,
        '[{"Ref":"AWS::NoValue"}]',
    );

    out = out.replace(
        /{"Ref":"VPCSecurityGroupIdList"}/g,
        '[{"Ref":"AWS::NoValue"}]',
    );

    return JSON.parse(out);
});

