#!/bin/bash

# Check to see if the required parameters have been provided:
if [ -z "$1" ]; then
    echo "Please provide the IAM Role you want to apply the policies to"
    echo "For example: ./create-min-policy.sh my-role-name"
    exit 1
fi

# Variables
ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
ROLE_NAME="$1"

# Create IAM policies the provided roles
AI_POLICY_NAME="qnabot-ai-policy"
aws iam create-policy \
  --policy-name $AI_POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "es:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "kendra:Query",
                "kendra:Retrieve"
            ],
            "Resource": [
                "arn:aws:kendra:*:*:index/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:InvokeModel"
            ],
            "Resource": [
                "arn:aws:bedrock:*:*:foundation-model/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:Retrieve",
                "bedrock:RetrieveAndGenerate"
            ],
            "Resource": [
                "arn:aws:bedrock:*:*:knowledge-base/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "sagemaker:InvokeEndpoint"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "translate:TranslateText",
                "comprehend:DetectDominantLanguage",
                "comprehend:DetectEntities",
                "comprehend:DetectKeyPhrases",
                "comprehend:DetectPiiEntities",
                "comprehend:ContainsPiiEntities",
                "comprehend:DetectSentiment",
                "comprehend:DetectSyntax",
                "comprehend:DescribeEntityRecognizer",
                "comprehend:ListEntityRecognizers"
            ],
            "Resource": "*"
        }
    ]
  }'


APIGATEWAY_POLICY_NAME="qnabot-apigateway-policy"
aws iam create-policy \
  --policy-name $APIGATEWAY_POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
       {
            "Effect": "Allow",
            "Action": "apigateway:*",
            "Resource": [
                "arn:aws:apigateway:*::/restapis/*",
                "arn:aws:apigateway:*::/restapis",
                "arn:aws:apigateway:*::/deployments",
                "arn:aws:apigateway:*::/stages",
                "arn:aws:apigateway:*::/documentation/versions",
                "arn:aws:apigateway:*::/accoun",
                "arn:aws:apigateway:*::/account"
            ]
        }
    ]
  }'


CF_POLICY_NAME="qnabot-cf-policy"
aws iam create-policy \
  --policy-name $CF_POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
       {
            "Effect": "Allow",
            "Action": [
                "cloudformation:CreateChangeSet",
                "cloudformation:CreateStack",
                "cloudformation:DeleteStack",
                "cloudformation:DescribeChangeSet",
                "cloudformation:DescribeStackEvents",
                "cloudformation:DescribeStackResource",
                "cloudformation:DescribeStacks",
                "cloudformation:ExecuteChangeSet",
                "cloudformation:GetStackPolicy",
                "cloudformation:GetTemplate",
                "cloudformation:GetTemplateSummary",
                "cloudformation:ListStackResources",
                "cloudformation:ListStacks",
                "cloudformation:UpdateStack",
                "cloudformation:ValidateTemplate"
            ],
            "Resource": [
                "arn:aws:cloudformation:*:*:*"
            ]
        }
    ]
  }'


COGNITO_POLICY_NAME="qnabot-cognito-policy"
aws iam create-policy \
  --policy-name $COGNITO_POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
       {
            "Effect": "Allow",
            "Action": [
                "cognito-idp:CreateUserPool",
                "cognito-idp:DescribeUserPool",
                "cognito-idp:UpdateUserPool",
                "cognito-idp:DeleteUserPool",
                "cognito-idp:CreateUserPoolClient",
                "cognito-idp:DescribeUserPoolClient",
                "cognito-idp:UpdateUserPoolClient",
                "cognito-idp:DeleteUserPoolClient",
                "cognito-idp:AdminInitiateAuth",
                "cognito-idp:AdminUserGlobalSignOut",
                "cognito-idp:ListUserPoolClients",
                "cognito-idp:GetGroup",
                "cognito-idp:CreateGroup",
                "cognito-idp:DeleteGroup",
                "cognito-idp:AdminGetUser",
                "cognito-idp:AdminCreateUser",
                "cognito-idp:AdminDeleteUser",
                "cognito-idp:AdminListGroupsForUser",
                "cognito-idp:AdminAddUserToGroup",
                "cognito-idp:AdminRemoveUserFromGroup"
            ],
            "Resource": [
                "arn:aws:cognito-idp:*:*:userpool/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cognito-identity:DescribeIdentityPool",
                "cognito-identity:CreateIdentityPool",
                "cognito-identity:DeleteIdentityPool",
                "cognito-identity:UpdateIdentityPool",
                "cognito-identity:GetIdentityPoolRoles",
                "cognito-identity:SetIdentityPoolRoles"
            ],
            "Resource": [
                "arn:aws:cognito-identity:*:*:identitypool/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:PassRole"
            ],
            "Resource": [
                "arn:aws:iam::*:role/*"
            ],
            "Condition": {
                "StringLike": {
                    "iam:PassedToService": [
                        "cognito-identity.amazonaws.com",
                        "lex.amazonaws.com",
                        "lexv2.amazonaws.com",
                        "channels.lex.amazonaws.com",
                        "channels.lexv2.amazonaws.com"
                    ]
                }
            }
        }
    ]
  }'


EVENT_POLICY_NAME="qnabot-event-policy"
aws iam create-policy \
  --policy-name $EVENT_POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
       {
            "Effect": "Allow",
            "Action": [
                "servicecatalog:AssociateAttributeGroup",
                "servicecatalog:AssociateResource",
                "servicecatalog:CreateApplication",
                "servicecatalog:CreateAttributeGroup",
                "servicecatalog:DeleteApplication",
                "servicecatalog:DeleteAttributeGroup",
                "servicecatalog:DisassociateAttributeGroup",
                "servicecatalog:DisassociateResource",
                "servicecatalog:GetApplication",
                "servicecatalog:GetAttributeGroup",
                "servicecatalog:TagResource",
                "servicecatalog:UpdateApplication",
                "servicecatalog:UpdateAttributeGroup"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DeleteLogGroup",
                "logs:DeleteLogStream",
                "logs:DeleteResourcePolicy",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams",
                "logs:DescribeResourcePolicies",
                "logs:GetLogEvents",
                "logs:PutLogEvents",
                "logs:PutResourcePolicy"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "sns:CreateTopic",
                "sns:DeleteTopic",
                "sns:GetTopicAttributes",
                "sns:ListTopics",
                "sns:Publish",
                "sns:SetTopicAttributes",
                "sns:Subscribe",
                "sns:Unsubscribe"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:DeleteParameter",
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:PutParameter",
                "ssm:StartSession"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateGlobalTable",
                "dynamodb:CreateTable",
                "dynamodb:DeleteItem",
                "dynamodb:DeleteTable",
                "dynamodb:DescribeContinuousBackups",
                "dynamodb:DescribeGlobalTable",
                "dynamodb:DescribeTable",
                "dynamodb:DescribeTimeToLive",
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:Query",
                "dynamodb:Scan",
                "dynamodb:UpdateContinuousBackups",
                "dynamodb:UpdateGlobalTable",
                "dynamodb:UpdateTable",
                "dynamodb:UpdateTimeToLive"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "events:DeleteRule",
                "events:DescribeRule",
                "events:DisableRule",
                "events:EnableRule",
                "events:ListTargetsByRule",
                "events:ListRuleNamesByTarget",
                "events:PutRule",
                "events:PutTargets",
                "events:RemoveTargets"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "firehose:CreateDeliveryStream",
                "firehose:DeleteDeliveryStream",
                "firehose:DescribeDeliveryStream"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:CancelKeyDeletion",
                "kms:CreateKey",
                "kms:Delete*",
                "kms:Describe*",
                "kms:Disable*",
                "kms:Decrypt",
                "kms:Enable*",
                "kms:EnableKey",
                "kms:Encrypt",
                "kms:GenerateDataKey",
                "kms:Get*",
                "kms:List*",
                "kms:PutKeyPolicy",
                "kms:Put*",
                "kms:Revoke*",
                "kms:ScheduleKeyDeletion",
                "kms:UpdateKeyDescription",
                "kms:Update*"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:DeleteDashboards",
                "cloudwatch:GetDashboard",
                "cloudwatch:GetMetricStatistics",
                "cloudwatch:ListDashboards",
                "cloudwatch:PutDashboard"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "cloudfront:CreateCloudFrontOriginAccessIdentity",
                "cloudfront:CreateDistribution",
                "cloudfront:CreateResponseHeadersPolicy",
                "cloudfront:DeleteCloudFrontOriginAccessIdentity",
                "cloudfront:DeleteDistribution",
                "cloudfront:DeleteResponseHeadersPolicy",
                "cloudfront:GetCloudFrontOriginAccessIdentity",
                "cloudfront:GetDistribution",
                "cloudfront:GetResponseHeadersPolicy",
                "cloudfront:TagResource",
                "cloudfront:UnTagResource",
                "cloudfront:UpdateCloudFrontOriginAccessIdentity",
                "cloudfront:UpdateDistribution",
                "cloudfront:UpdateResponseHeadersPolicy"
            ],
            "Resource": [
                "*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "chatbot:*",
                "codebuild:*",
                "codecommit:*",
                "codestar-connections:*",
                "codestar-notifications:*",
                "ec2:DescribeVpcs",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeSubnets",
                "ecr:DescribeRepositories",
                "ecr:ListImages",
                "elasticfilesystem:DescribeFileSystems",
                "s3:GetBucketLocation",
                "s3:ListAllMyBuckets",
                "sqs:CreateQueue",
                "sqs:SendMessage",
                "secretsmanager:CreateSecret",
                "secretsmanager:UpdateSecret",
                "secretsmanager:DeleteSecret"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "wafv2:AssociateWebACL",
                "wafv2:CreateWebACL",
                "wafv2:DeleteWebACL",
                "wafv2:UpdateWebACL"
            ],
            "Resource": [
                "*"
            ]
        }
    ]
  }'


IAM_POLICY_NAME="qnabot-iam-policy"
aws iam create-policy \
  --policy-name $IAM_POLICY_NAME \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
       {
            "Effect": "Allow",
            "Action": [
                "iam:AttachRolePolicy",
                "iam:CreatePolicy",
                "iam:CreatePolicyVersion",
                "iam:CreateRole",
                "iam:CreateServiceLinkedRole",
                "iam:DeletePolicy",
                "iam:DeleteRole",
                "iam:DeleteRolePolicy",
                "iam:DeletePolicyVersion",
                "iam:DeleteServiceLinkedRole",
                "iam:DetachRolePolicy",
                "iam:GetPolicy",
                "iam:GetRole",
                "iam:GetServiceLinkedRoleDeletionStatus",
                "iam:ListPolicyVersions",
                "iam:PassRole",
                "iam:PutRolePolicy",
                "iam:UpdateRole"
            ],
            "Resource": [
                "arn:aws:iam::*:role/*",
                "arn:aws:iam::*:policy/*"
            ]
        }
    ]
  }'


# Attach policy to the role
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$AI_POLICY_NAME

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$APIGATEWAY_POLICY_NAME

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$COGNITO_POLICY_NAME

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$CF_POLICY_NAME

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$EVENT_POLICY_NAME
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/$IAM_POLICY_NAME

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AmazonKinesisFirehoseFullAccess

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AmazonLexFullAccess

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AmazonS3FullAccess

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/AWSLambda_FullAccess


echo "Policies for IAM Role created successfully."