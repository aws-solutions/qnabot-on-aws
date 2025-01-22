/** ************************************************************************************************
 *   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
 *   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

/* eslint-disable quotes */
/* eslint-disable indent */
const util = require('../util');

module.exports = {
    StreamingLambda: {
        Type: 'AWS::Lambda::Function',
        Properties: {
            VpcConfig: {
                'Fn::If': [
                    'VPCEnabled',
                    {
                        Subnets: { 'Fn::Split': [',', { Ref: 'VPCSubnetIdList' }] },
                        SecurityGroupIds: { 'Fn::Split': [',', { Ref: 'VPCSecurityGroupIdList' }] }
                    },
                    { Ref: 'AWS::NoValue' }
                ]
            },
            TracingConfig: {
                'Fn::If': ['XRAYEnabled', { Mode: 'Active' }, { Ref: 'AWS::NoValue' }]
            },
            Description: 'AWS Lambda Function to initiate web socket connection for streaming',
            Handler: 'index.handler',
            Role: { 'Fn::GetAtt': ['StreamingLambdaExecutionRole', 'Arn'] },
            Runtime: process.env.npm_package_config_lambdaRuntime,
            MemorySize: 128,
            Timeout: 900,
            Environment: {
                Variables: {
                    STREAMING_TABLE: { Ref: 'StreamingDynamoTable' },
                    ...util.getCommonEnvironmentVariables()
                }
            },
            Code: {
                S3Bucket: { Ref: 'BootstrapBucket' },
                S3Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/streaming.zip' },
                S3ObjectVersion: { Ref: 'StreamingCodeVersion' }
            }
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W92']),
            guard: util.cfnGuard('LAMBDA_CONCURRENCY_CHECK', 'LAMBDA_INSIDE_VPC')
        }
    },
    StreamingLambdaLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/lambda/${AWS::StackName}-StreamingLambda' },
                        { 'Fn::Select': ['2', { 'Fn::Split': ['/', { Ref: 'AWS::StackId' }] }] }
                    ]
                ]
            },

            RetentionInDays: {
                'Fn::If': ['LogRetentionPeriodIsNotZero', { Ref: 'LogRetentionPeriod' }, { Ref: 'AWS::NoValue' }]
            }
        },
        Metadata: {
            guard: util.cfnGuard('CLOUDWATCH_LOG_GROUP_ENCRYPTED', 'CW_LOGGROUP_RETENTION_PERIOD_CHECK')
        }
    },
    StreamingLambdaExecutionRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            ManagedPolicyArns: {
                'Fn::If': [
                    'VPCEnabled',
                    ['arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'],
                    { Ref: 'AWS::NoValue' }
                ]
            },
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: ['lambda.amazonaws.com']
                        },
                        Action: ['sts:AssumeRole']
                    }
                ]
            },
            Path: '/',
            Policies: [
                {
                    PolicyName: 'StreamingExecutionPolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                                Resource: [
                                    {
                                        'Fn::Sub':
                                            'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
                                    }
                                ]
                            },
                            {
                                Effect: 'Allow',
                                Action: ['dynamodb:PutItem'],
                                Resource: [
                                    {
                                        'Fn::Sub':
                                            'arn:${AWS::Partition}:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${StreamingDynamoTable}'
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11', 'W12']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK')
        }
    },
    StreamingCodeVersion: {
        Type: 'Custom::S3Version',
        Properties: {
            ServiceToken: { Ref: 'CFNLambda' },
            Bucket: { Ref: 'BootstrapBucket' },
            Key: { 'Fn::Sub': '${BootstrapPrefix}/lambda/streaming.zip' },
            BuildDate: new Date().toISOString()
        }
    },
    StreamingLambdaInvokePermission: {
        Type: 'AWS::Lambda::Permission',
        Properties: {
            FunctionName: { Ref: 'StreamingLambda' },
            Action: 'lambda:InvokeFunction',
            Principal: 'apigateway.amazonaws.com',
            SourceArn: {
                'Fn::Sub': 'arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${WebSocketAPI}/*'
            }
        }
    },
    StreamingDynamoTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            AttributeDefinitions: [
                {
                    AttributeName: 'sessionId',
                    AttributeType: 'S'
                }
            ],
            KeySchema: [
                {
                    AttributeName: 'sessionId',
                    KeyType: 'HASH'
                }
            ],
            BillingMode: 'PAY_PER_REQUEST',
            PointInTimeRecoverySpecification: {
                PointInTimeRecoveryEnabled: true
            },
            SSESpecification: {
                SSEEnabled: true
            },
            TimeToLiveSpecification: {
                AttributeName: 'ttl',
                Enabled: true
            }
        },
        Metadata: { cfn_nag: util.cfnNag(['W74']) }
    },
    WebSocketAPI: {
        Type: 'AWS::ApiGatewayV2::Api',
        Properties: {
            Name: 'QNA-WEBSocketAPI',
            ProtocolType: 'WEBSOCKET',
            RouteSelectionExpression: '$request.body.action'
        }
    },
    ConnectRoute: {
        Type: 'AWS::ApiGatewayV2::Route',
        Properties: {
            ApiId: { Ref: 'WebSocketAPI' },
            RouteKey: '$connect',
            AuthorizationType: 'AWS_IAM',
            OperationName: 'ConnectRoute',
            Target: {
                'Fn::Join': ['/', ['integrations', { Ref: 'ConnectIntegration' }]]
            }
        }
    },
    ConnectIntegration: {
        Type: 'AWS::ApiGatewayV2::Integration',
        Properties: {
            ApiId: { Ref: 'WebSocketAPI' },
            Description: 'Connect Integration',
            IntegrationType: 'AWS_PROXY',
            IntegrationUri: {
                'Fn::Sub':
                    'arn:${AWS::Partition}:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${StreamingLambda.Arn}/invocations'
            }
        }
    },
    PingRoute: {
        Type: 'AWS::ApiGatewayV2::Route',
        Properties: {
            ApiId: { Ref: 'WebSocketAPI' },
            RouteKey: 'ping',
            OperationName: 'PingRoute',
            Target: {
                'Fn::Join': ['/', ['integrations', { Ref: 'PingIntegration' }]]
            }
        }
    },
    PingIntegration: {
        Type: 'AWS::ApiGatewayV2::Integration',
        Properties: {
            ApiId: { Ref: 'WebSocketAPI' },
            Description: 'Ping Integration',
            IntegrationType: 'MOCK',
            PassthroughBehavior: 'WHEN_NO_MATCH',
            RequestTemplates: {
                'application/json': '{"statusCode":200}'
            }
        }
    },    
    WebSocketDeployment: {
        Type: 'AWS::ApiGatewayV2::Deployment',
        DependsOn: ['ConnectRoute', 'PingRoute'],
        Properties: {
            ApiId: { Ref: 'WebSocketAPI' }
        }
    },
    WebSocketStage: {
        Type: 'AWS::ApiGatewayV2::Stage',
        Properties: {
            StageName: 'Prod',
            Description: 'QnABot WebSocket Stage',
            DeploymentId: { Ref: 'WebSocketDeployment' },
            ApiId: { Ref: 'WebSocketAPI' },
            DefaultRouteSettings: {
                LoggingLevel: 'INFO',
            },
            AccessLogSettings: {
                DestinationArn: { "Fn::GetAtt": ["WebSocketLogGroup", "Arn"] },
                Format: JSON.stringify({
                    requestId: '$context.requestId',
                    connectedAt: '$context.connectedAt',
                    apiId: '$context.apiId',
                    requestTime: '$context.requestTime',
                    stage: '$context.stage',
                    eventType: '$context.eventType',
                    routeKey: '$context.routeKey',
                    connectionId: '$context.connectionId',
                    messageDirection: '$context.messageDirection',
                    status: '$context.status',
                    errorMessage: '$context.error.message',
                    validationError: '$context.error.validationErrorString',
                    integrationError: '$context.integrationErrorMessage',
                    authorizeError: '$context.authorizer.error',
                    responseLatency: '$context.integrationLatency',
                    sourceIp: '$context.identity.sourceIp'
                })
            }            
        }
    },
    WebSocketLogGroup: {
        Type: 'AWS::Logs::LogGroup',
        Properties: {
            LogGroupName: {
                'Fn::Join': [
                    '-',
                    [
                        { 'Fn::Sub': '/aws/apigatewayv2/${AWS::StackName}-WebSocket' },
                        { 'Fn::Select': ['2', { 'Fn::Split': ['/', { Ref: 'AWS::StackId' }] }] }
                    ]
                ]
            },
            RetentionInDays: {
                'Fn::If': ['LogRetentionPeriodIsNotZero', { Ref: 'LogRetentionPeriod' }, { Ref: 'AWS::NoValue' }]
            }
        },
        Metadata: {
            guard: util.cfnGuard('CLOUDWATCH_LOG_GROUP_ENCRYPTED', 'CW_LOGGROUP_RETENTION_PERIOD_CHECK')
        }
    },
    WebSocketApiLoggingRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            AssumeRolePolicyDocument: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: ['apigateway.amazonaws.com']
                        },
                        Action: ['sts:AssumeRole']
                    }
                ]
            },
            Path: '/',
            Policies: [
                {
                    PolicyName: 'WebSocketApiLoggingPolicy',
                    PolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Action: [
                                  'logs:DescribeLogGroups'
                              ],
                                Resource: ["*"]
                            },
                            {
                                Effect: 'Allow',
                                Action: [
                                    'logs:CreateLogGroup',
                                    'logs:CreateLogStream',
                                    'logs:DescribeLogStreams',
                                    'logs:PutLogEvents',
                                    'logs:GetLogEvents',
                                    'logs:FilterLogEvents'
                                ],
                                Resource: [
                                    {
                                        'Fn::Sub': 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:*'
                                    }
                                ]
                            }
                        ]
                    }
                }
            ]
        },
        Metadata: {
            cfn_nag: util.cfnNag(['W11']),
            guard: util.cfnGuard('IAM_NO_INLINE_POLICY_CHECK')
        }
    },
    ApiGatewayAccountConfig: {
        Type: 'AWS::ApiGateway::Account',
        Properties: {
            CloudWatchRoleArn: { 'Fn::GetAtt': ['WebSocketApiLoggingRole', 'Arn'] }
        }
    }
};
