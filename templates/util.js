exports.stack=function(name,parameters){
    return {
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" : {"Fn::Join":["/",[
                "https://s3.amazonaws.com",
                {"Ref":"BootstrapBucket"},
                {"Ref":"BootstrapPrefix"},
                "templates/"+name+'.json'
            ]]},
            "Parameters":Object.assign({
                "BootstrapBucket":{"Ref":"BootstrapBucket"},
                "BootstrapPrefix":{"Ref":"BootstrapPrefix"},
            },parameters)
        }
    }
}

exports.stacktest=function(name,parameters){
    return {
        "Type" : "AWS::CloudFormation::Stack",
        "Properties" : {
            "TemplateURL" : {"Fn::Join":["/",[
                "https://s3.amazonaws.com",
                {"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
                {"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"},
                "templates/"+name+'.min.json'
            ]]},
            "Parameters":Object.assign({
                "BootstrapBucket":{"Fn::ImportValue":"QNA-BOOTSTRAP-BUCKET"},
                "BootstrapPrefix":{"Fn::ImportValue":"QNA-BOOTSTRAP-PREFIX"}
            },parameters)
        }
    }
}

exports.httpsOnlyBucketPolicy = function(bucketName = "Bucket") {
    return {
        "Type": "AWS::S3::BucketPolicy",
        "Properties": {
            "Bucket": {
            "Ref": bucketName
            },
            "PolicyDocument": {
            "Statement": [
                {
                "Action": "*",
                "Condition": {
                    "Bool": {
                    "aws:SecureTransport": "false"
                    }
                },
                "Effect": "Deny",
                "Principal": "*",
                "Resource": {
                    "Fn::Join": [
                    "",
                    [
                        {
                        "Fn::GetAtt": [
                            bucketName,
                            "Arn"
                        ]
                        },
                        "/*"
                    ]
                    ]
                },
                "Sid": "HttpsOnly"
                }
            ],
            "Version": "2012-10-17"
            }
        },
    };
};

exports.basicLambdaExecutionPolicy = function() {
    return {
        "PolicyDocument": {
            "Statement": [
            {
                "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
                ],
                "Effect": "Allow",
                "Resource": {
                "Fn::Join": [
                    "",
                    [
                    "arn:",
                    {
                        "Ref": "AWS::Partition"
                    },
                    ":logs:",
                    {
                        "Ref": "AWS::Region"
                    },
                    ":",
                    {
                        "Ref": "AWS::AccountId"
                    },
                    ":log-group:/aws/lambda/*"
                    ]
                ]
                }
            }
            ],
            "Version": "2012-10-17"
        },
        "PolicyName": "LambdaFunctionServiceRolePolicy"
    };
};

exports.lambdaVPCAccessExecutionRole = function() {
    return {
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents",
                    ],
                    "Resource": {
                        "Fn::Join": [
                            "",
                            [
                            "arn:",
                            {
                                "Ref": "AWS::Partition"
                            },
                            ":logs:",
                            {
                                "Ref": "AWS::Region"
                            },
                            ":",
                            {
                                "Ref": "AWS::AccountId"
                            },
                            ":log-group:/aws/lambda/*"
                            ]
                        ]
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:CreateNetworkInterface",
                        "ec2:AssignPrivateIpAddresses",
                        "ec2:UnassignPrivateIpAddresses",
                        "ec2:DescribeNetworkInterfaces",
                        "ec2:DeleteNetworkInterface"
                    ],
                    "Resource": "*"
                }
            ]
        },
        "PolicyName": "lambdaVPCAccessExecutionRole"
    };
};

exports.xrayDaemonWriteAccess = function() {
    return {
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords",
                        "xray:GetSamplingRules",
                        "xray:GetSamplingTargets",
                        "xray:GetSamplingStatisticSummaries"
                    ],
                    "Resource": [
                        "*"
                    ]
                }
            ]
        },
        "PolicyName": "xrayDaemonWriteAccess"
    };
};

exports.amazonKendraReadOnlyAccess = function() {
    return {
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "kendra:DescribeIndex",
                        "kendra:ListIndices",
                        "kendra:Query",
                        "kendra:GetQuerySuggestions"
                    ],
                    "Resource": [{"Fn::Sub": "arn:${AWS::Partition}:kendra:${AWS::Region}:${AWS::AccountId}:index/*"}]
                }
            ]
        },
        "PolicyName": "amazonKendraReadOnlyAccess"
    };
};

exports.translateReadOnly = function() {
    return {
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": [
                        "translate:TranslateText",
                        "translate:GetTerminology",
                        "translate:ListTerminologies",
                        "comprehend:DetectDominantLanguage",
                        "cloudwatch:GetMetricStatistics",
                        "cloudwatch:ListMetrics"
                    ],
                    "Effect": "Allow",
                    "Resource": "*"
                }
            ]
        },
        "PolicyName": "translateReadOnly"
    };
};

exports.lexFullAccess = function() {
    return {
        "PolicyName": "AWSQnaBotLexFullAccess",
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "polly:SynthesizeSpeech",
                        "logs:DescribeLogGroups",
                        "cloudwatch:DescribeAlarms",
                        "kms:DescribeKey",
                        "s3:GetBucketLocation",
                        "lambda:GetPolicy"
                    ],
                    "Resource": [
                        {"Fn::Sub": "arn:${AWS::Partition}:kms:${AWS::Region}:${AWS::AccountId}:key/*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:polly:${AWS::Region}:${AWS::AccountId}:lexicon/*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:cloudwatch:${AWS::Region}:${AWS::AccountId}:alarm:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:s3:::*"},
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListAllMyBuckets",
                        "lambda:ListFunctions",
                        "cloudwatch:DescribeAlarmsForMetric",
                        "kms:ListAliases",
                        "iam:ListRoles",
                        "cloudwatch:GetMetricStatistics",
                        "kendra:ListIndices",
                        "polly:DescribeVoices"
                    ],
                    "Resource": "*"
                },
                { // Lex V1 policies
                    "Effect": "Allow",
                    "Action": [
                        "lex:GetBuiltinIntent",
                        "lex:GetIntents",
                        "lex:GetBots",
                        "lex:GetSlotTypes",
                        "lex:GetBotAliases",
                        "lex:StartImport",
                        "lex:GetMigration",
                        "lex:GetBuiltinSlotTypes",
                        "lex:GetBuiltinIntents",
                        "lex:GetImport",
                        "lex:GetMigrations"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": "lex:*",
                    "Resource": [
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:intent:*:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:slottype:*:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot:*:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot-channel:*:*"},
                    ]
                },
                { // Lex V2 policies
                    "Effect": "Allow",
                    "Action": [
                        "lex:CreateUploadUrl",
                        "lex:ListBuiltInSlotTypes",
                        "lex:ListBots",
                        "lex:ListBuiltInIntents",
                        "lex:ListImports",
                        "lex:ListExports"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": "lex:*",
                    "Resource": [
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot-alias/*/*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot-alias/*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot/*"},
                    ]
                },
                { // Lex V1 policies
                    "Effect": "Allow",
                    "Action": [
                        "lex:GetBuiltinIntent",
                        "lex:GetIntents",
                        "lex:GetBots",
                        "lex:GetSlotTypes",
                        "lex:GetBotAliases",
                        "lex:StartImport",
                        "lex:GetMigration",
                        "lex:GetBuiltinSlotTypes",
                        "lex:GetBuiltinIntents",
                        "lex:GetImport",
                        "lex:GetMigrations"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": "lex:*",
                    "Resource": [
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:intent:*:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:slottype:*:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot:*:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot:*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot-channel:*:*"},
                    ]
                },
                { // Lex V2 policies
                    "Effect": "Allow",
                    "Action": [
                        "lex:CreateUploadUrl",
                        "lex:ListBuiltInSlotTypes",
                        "lex:ListBots",
                        "lex:ListBuiltInIntents",
                        "lex:ListImports",
                        "lex:ListExports"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": "lex:*",
                    "Resource": [
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot-alias/*/*"},
                        {"Fn::Sub": "arn:${AWS::Partition}:lex:${AWS::Region}:${AWS::AccountId}:bot/*"},
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "lambda:AddPermission",
                        "lambda:RemovePermission"
                    ],
                    "Resource": {"Fn::Sub": "arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:AmazonLex*"},
                    "Condition": {
                        "StringEquals": {
                            "lambda:Principal": "lex.amazonaws.com"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:GetRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/lex.amazonaws.com/AWSServiceRoleForLexBots",
                        "arn:aws:iam::*:role/aws-service-role/channels.lex.amazonaws.com/AWSServiceRoleForLexChannels",
                        "arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*",
                        "arn:aws:iam::*:role/aws-service-role/channels.lexv2.amazonaws.com/AWSServiceRoleForLexV2Channels*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:CreateServiceLinkedRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/lex.amazonaws.com/AWSServiceRoleForLexBots"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "iam:AWSServiceName": "lex.amazonaws.com"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:CreateServiceLinkedRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/channels.lex.amazonaws.com/AWSServiceRoleForLexChannels"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "iam:AWSServiceName": "channels.lex.amazonaws.com"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:CreateServiceLinkedRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "iam:AWSServiceName": "lexv2.amazonaws.com"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:CreateServiceLinkedRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/channels.lexv2.amazonaws.com/AWSServiceRoleForLexV2Channels*"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "iam:AWSServiceName": "channels.lexv2.amazonaws.com"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:DeleteServiceLinkedRole",
                        "iam:GetServiceLinkedRoleDeletionStatus"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/lex.amazonaws.com/AWSServiceRoleForLexBots",
                        "arn:aws:iam::*:role/aws-service-role/channels.lex.amazonaws.com/AWSServiceRoleForLexChannels",
                        "arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*",
                        "arn:aws:iam::*:role/aws-service-role/channels.lexv2.amazonaws.com/AWSServiceRoleForLexV2Channels*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:PassRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/lex.amazonaws.com/AWSServiceRoleForLexBots"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "iam:PassedToService": [
                                "lex.amazonaws.com"
                            ]
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:PassRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/lexv2.amazonaws.com/AWSServiceRoleForLexV2Bots*"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "iam:PassedToService": [
                                "lexv2.amazonaws.com"
                            ]
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "iam:PassRole"
                    ],
                    "Resource": [
                        "arn:aws:iam::*:role/aws-service-role/channels.lexv2.amazonaws.com/AWSServiceRoleForLexV2Channels*"
                    ],
                    "Condition": {
                        "StringEquals": {
                            "iam:PassedToService": [
                                "channels.lexv2.amazonaws.com"
                            ]
                        }
                    }
                }
            ]
        },
    };
};

exports.esCognitoAccess = function() {
    return {
        "PolicyName": "AWSQnaBotESCognitoAccess",
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "cognito-idp:DescribeUserPool",
                        "cognito-idp:CreateUserPoolClient",
                        "cognito-idp:DeleteUserPoolClient",
                        "cognito-idp:DescribeUserPoolClient",
                        "cognito-idp:AdminInitiateAuth",
                        "cognito-idp:AdminUserGlobalSignOut",
                        "cognito-idp:ListUserPoolClients"
                    ],
                    "Resource": [
                        {"Fn::GetAtt" : [ "UserPool" , "Arn" ]}
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cognito-identity:DescribeIdentityPool",
                        "cognito-identity:UpdateIdentityPool",
                        "cognito-identity:GetIdentityPoolRoles"
                    ],
                    "Resource": [{"Fn::Sub": "arn:${AWS::Partition}:cognito-identity:${AWS::Region}:${AWS::AccountId}:identitypool/*"}]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cognito-identity:SetIdentityPoolRoles",
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": "iam:PassRole",
                    "Resource": "*",
                    "Condition": {
                        "StringLike": {
                            "iam:PassedToService": "cognito-identity.amazonaws.com"
                        }
                    }
                }
            ]
        }
    };
};

exports.comprehendReadOnly = function() {
    return {
        "PolicyName": "AWSQnaBotComprehendReadOnly",
        "PolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "comprehend:DetectDominantLanguage",
                        "comprehend:DetectEntities",
                        "comprehend:DetectKeyPhrases",
                        "comprehend:DetectPiiEntities",
                        "comprehend:ContainsPiiEntities",
                        "comprehend:DetectSentiment",
                        "comprehend:DetectSyntax",
                        "comprehend:DescribeEntityRecognizer",
                        "comprehend:ListEntityRecognizers",
                    ],
                    "Resource": "*"
                }
            ]
        }
    };
};


exports.cfnNagXray = function() {
    return {
        "cfn_nag": {
            "rules_to_suppress": [{
                "id": "W12",
                "reason": "Lambda needs the following minimum required permissions to send trace data to X-Ray"
            }]
        }
    };
};

exports.cfnNag = function(rules) {
    suppressed_rules = {
        "W11": {
            "id": "W11",
            "reason": "This IAM role requires to have * resource on its permission policy"
        },
        "W12": {
            "id": "W12",
            "reason": "Lambda needs the following minimum required permissions to send trace data to X-Ray"
        },
        "W13": {
            "id": "W13",
            "reason": "This IAM policy requires to have * resource"
        },
        "W35": {
            "id": "W35",
            "reason": "Access logging is not required for this Bucket."
        },
        "W47": {
            "id": "W47",
            "reason": "This SNS Topic does not need KmsMasterKeyId property."
        },
        "W57": {
            "id": "W57",
            "reason": "This IdentityPool has proper restrictions for unauthenticated users"
        },
        "W59": {
            "id": "W59",
            "reason": "This ApiGateway Method does not need authorization setup"
        },
        "W64": {
            "id": "W64",
            "reason": "This apiGateway stage does not require to be associated with a usage plan"
        },
        "W69": {
            "id": "W69",
            "reason": "This apiGateway stage does not require to have access logging"
        },
        "W74": {
            "id": "W74",
            "reason": "This DynamoDB table does not require CMK encryption store in KMS"
        },
        "W76": {
            "id": "W76",
            "reason": "This role is required to have high SPCM"
        },
        "W78": {
            "id": "W78",
            "reason": "This DynamoDB table does not require to have backup enabled"
        },
        "W89": {
            "id": "W89",
            "reason": "This Lambda Function is not required to be inside VPC"
        },
        "W92": {
            "id": "W92",
            "reason": "This lambda function does not require to have ReservedConcurrentExecutions"
        },
        "F3": {
            "id": "F3",
            "reason": "This role policy is required to have * action in its policy"
        },
        "F5": {
            "id": "F5",
            "reason": "This role policy is required to have * action in its policy"
        },
        "F38": {
            "id": "F38",
            "reason": "This role policy is required to have * action in its policy with PassRole action"
        },
    };

    return {
        "cfn_nag": {
            "rules_to_suppress": rules.map((rule) => suppressed_rules[rule])
        }
    };
};