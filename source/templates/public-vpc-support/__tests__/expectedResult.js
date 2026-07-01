/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    "Parameters": {
        "VPCSubnetIdList": {
            "Type": "List<AWS::EC2::Subnet::Id>",
            "AllowedPattern": ".+"
        },
        "VPCSecurityGroupIdList": {
            "Type": "List<AWS::EC2::SecurityGroup::Id>",
            "AllowedPattern": ".+"
        }
    },
    "Conditions": {
        "Public": {
            "Fn::Equals": [
                {
                    "Ref": "PublicOrPrivate"
                },
                "PUBLIC"
            ]
        },
        "AdminSignUp": {
            "Fn::Equals": [
                true,
                true
            ]
        },
        "Domain": {
            "Fn::Equals": [
                true,
                false
            ]
        },
        "BuildExamples": {
            "Fn::Equals": [
                true,
                true
            ]
        },
        "FGACEnabled": {
            "Fn::Equals": [
                true,
                true
            ]
        },
        "CreateDomain": {
            "Fn::Equals": [
                true,
                true
            ]
        },
        "DontCreateDomain": {
            "Fn::Equals": [
                true,
                false
            ]
        },
        "VPCEnabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        "",
                        {
                            "Fn::Join": [
                                "",
                                {
                                    "Ref": "VPCSecurityGroupIdList"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        "BedrockEnable": {
            "Fn::Or": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "LLMApi"
                        },
                        "BEDROCK"
                    ]
                },
                {
                    "Fn::Equals": [
                        {
                            "Ref": "EmbeddingsApi"
                        },
                        "BEDROCK"
                    ]
                }
            ]
        },
        "EmbeddingsEnable": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "EmbeddingsApi"
                        },
                        "DISABLED"
                    ]
                }
            ]
        },
        "EmbeddingsBedrock": {
            "Fn::Equals": [
                {
                    "Ref": "EmbeddingsApi"
                },
                "BEDROCK"
            ]
        },
        "EmbeddingsLambda": {
            "Fn::Equals": [
                {
                    "Ref": "EmbeddingsApi"
                },
                "LAMBDA"
            ]
        },
        "EmbeddingsLambdaArn": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Ref": "EmbeddingsLambdaArn"
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill0Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                0,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill1Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                1,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill2Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                2,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill3Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                3,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill4Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                4,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill5Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                5,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill6Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                6,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill7Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                7,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill8Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                8,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill9Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                9,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill10Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                10,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill11Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                11,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill12Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                12,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill13Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                13,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill14Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                14,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill15Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                15,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill16Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                16,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill17Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                17,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill18Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                18,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill19Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                19,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill20Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                20,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill21Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                21,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill22Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                22,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill23Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                23,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill24Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                24,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill25Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                25,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill26Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                26,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill27Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                27,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill28Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                28,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        },
        "AlexaSkill29Enabled": {
            "Fn::Not": [
                {
                    "Fn::Equals": [
                        {
                            "Fn::Select": [
                                29,
                                {
                                    "Fn::Split": [
                                        ",",
                                        {
                                            "Fn::Join": [
                                                ",",
                                                [
                                                    {
                                                        "Ref": "AlexaSkillIds"
                                                    },
                                                    ",,,,,,,,,,,,,,,,,,,,,,,,,,,,,"
                                                ]
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        ""
                    ]
                }
            ]
        }
    },
    "Description": "(SO0189) QnABot with admin and client websites - Version vx.x.x",
    "Outputs": {},
    "Metadata": {
        "AWS::CloudFormation::Interface": {
            "ParameterGroups": [
                {
                    "Label": {
                        "default": "Step 2A: Set Basic Chatbot Parameters (required)"
                    },
                    "Parameters": [
                        "Email",
                        "Username",
                        "PublicOrPrivate",
                        "Language",
                        "OpenSearchDedicatedMasterNodes",
                        "OpenSearchMasterNodeInstanceType",
                        "OpenSearchMasterNodeCount",
                        "OpenSearchNodeInstanceType",
                        "OpenSearchNodeCount",
                        "OpenSearchEBSVolumeSize",
                        "OpenSearchDashboardsRetentionMinutes",
                        "OpenSearchFineGrainAccessControl",
                        "LexV2BotLocaleIds",
                        "LexBotVersion",
                        "InstallLexResponseBots",
                        "FulfillmentConcurrency",
                        "XraySetting"
                    ]
                },
                {
                    "Label": {
                        "default": "Step 2B: Set VPC parameters to deploy QnABot in an existing VPC (required)"
                    },
                    "Parameters": [
                        "VPCSubnetIdList",
                        "VPCSecurityGroupIdList"
                    ]
                },
                {
                    "Label": {
                        "default": "Step 2C: Enable LLM for Semantic Search with Embeddings (optional)"
                    },
                    "Parameters": [
                        "EmbeddingsApi",
                        "EmbeddingsBedrockModelId",
                        "EmbeddingsLambdaArn",
                        "EmbeddingsLambdaDimensions"
                    ]
                },
                {
                    "Label": {
                        "default": "Step 2D: Enable LLM Retrieval and generative text question answering to use with Fallback Option (optional)"
                    },
                    "Parameters": [
                        "LLMApi",
                        "LLMBedrockModelId",
                        "LLMLambdaArn",
                        "EnableStreaming"
                    ]
                },
                {
                    "Label": {
                        "default": "Step 2E: Select Data Sources as Fallback Option (optional)"
                    },
                    "Parameters": [
                        "KendraWebPageIndexId",
                        "KendraFaqIndexId",
                        "AltSearchKendraIndexes",
                        "AltSearchKendraIndexAuth",
                        "BedrockKnowledgeBaseId",
                        "BedrockKnowledgeBaseModel",
                        "LogRetentionPeriod"
                    ]
                },
                {
                    "Label": {
                        "default": "Step 2F: Set Alexa integration parameters (optional)"
                    },
                    "Parameters": [
                        "AlexaSkillIds"
                    ]
                }
            ]
        }
    }
};
