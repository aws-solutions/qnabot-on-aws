/* eslint-disable indent */
/* eslint-disable quotes */
var fs = require('fs');
const util = require('../util');

var files = fs.readdirSync(`${__dirname}`)
  .filter(x => !x.match(/README.md|Makefile|index|test|outputs|.DS_Store/))
  .map(x => require(`./${x}`))

module.exports = Object.assign(
  {
    "ExportCodeVersion": {
      "Type": "Custom::S3Version",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "BootstrapBucket"},
        "Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/export.zip"},
        "BuildDate": (new Date()).toISOString()
      }
    },
    "ConnectCodeVersion": {
      "Type": "Custom::S3Version",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "BootstrapBucket"},
        "Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/connect.zip"},
        "BuildDate": (new Date()).toISOString()
      }
    },
    "ConnectLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": {"Ref": "BootstrapBucket"},
          "S3Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/connect.zip"},
          "S3ObjectVersion": {"Ref": "ConnectCodeVersion"}
        },
        "Environment": {
          "Variables": {
            outputBucket: {"Ref": "ExportBucket"},
            s3Prefix: "connect/",
            accountId: {"Ref": "AWS::AccountId"},
            region: {"Ref": "AWS::Region"},
            LexVersion: {"Ref": "LexVersion"},
            // Lex V1
            fallBackIntent: {"Ref": "FallbackIntent"},
            intent: {"Ref": "Intent"},
            lexBot: {"Ref": "BotName"},
            // Lex V2
            LexV2BotName: {"Ref": "LexV2BotName"},
            LexV2BotId: {"Ref": "LexV2BotId"},
            LexV2BotAlias: {"Ref": "LexV2BotAlias"},
            LexV2BotAliasId: {"Ref": "LexV2BotAliasId"},
            LexV2BotLocaleIds: {"Ref": "LexV2BotLocaleIds"}
          }
        },
        "Handler": "index.handler",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ExportRole", "Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"}, {"Ref": "AWS::NoValue"}]
        },
        "Tags": [{
          Key: "Type",
          Value: "Export"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ConnectApiResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "ParentId": {"Ref": "ApiRootResourceId"},
        "PathPart": "connect",
        "RestApiId": {"Ref": "Api"}
      }
    },
    "InvokePermissionConnectLambda": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {"Fn::GetAtt": ["ConnectLambda", "Arn"]},
        "Principal": "apigateway.amazonaws.com"
      }
    },
    "GenesysCodeVersion": {
      "Type": "Custom::S3Version",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "BootstrapBucket"},
        "Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/genesys.zip"},
        "BuildDate": (new Date()).toISOString()
      }
    },
    "GenesysLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": {"Ref": "BootstrapBucket"},
          "S3Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/genesys.zip"},
          "S3ObjectVersion": {"Ref": "GenesysCodeVersion"}
        },
        "Environment": {
          "Variables": {
            outputBucket: {"Ref": "ExportBucket"},
            s3Prefix: "genesys/",
            accountId: {"Ref": "AWS::AccountId"},
            region: {"Ref": "AWS::Region"},
            LexVersion: {"Ref": "LexVersion"},
            // Lex V1
            fallBackIntent: {"Ref": "FallbackIntent"},
            intent: {"Ref": "Intent"},
            lexBot: {"Ref": "BotName"},
            // Lex V2
            LexV2BotName: {"Ref": "LexV2BotName"},
            LexV2BotId: {"Ref": "LexV2BotId"},
            LexV2BotAlias: {"Ref": "LexV2BotAlias"},
            LexV2BotAliasId: {"Ref": "LexV2BotAliasId"},
            LexV2BotLocaleIds: {"Ref": "LexV2BotLocaleIds"}
          }
        },
        "Handler": "index.handler",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ExportRole", "Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"}, {"Ref": "AWS::NoValue"}]
        },
        "Tags": [{
          Key: "Type",
          Value: "Export"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "GenesysApiResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "ParentId": {"Ref": "ApiRootResourceId"},
        "PathPart": "genesys",
        "RestApiId": {"Ref": "Api"}
      }
    },
    "InvokePermissionGenesysLambda": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {"Fn::GetAtt": ["GenesysLambda", "Arn"]},
        "Principal": "apigateway.amazonaws.com"
      }
    },
    Deployment: {
      Type: "Custom::ApiDeployment",
      DeletionPolicy: "Retain",
      DependsOn: [
        "ConnectGet",
        "ConnectApiResource",
        "InvokePermissionConnectLambda",
        "GenesysGet",
        "GenesysApiResource",
        "InvokePermissionGenesysLambda",
        "TranslatePost",
        "TranslateApiResource",
        "TranslateApiRootResource",
        "KendraNativeCrawlerPost",
        "KendraNativeCrawlerApiResource",
        "InvokePermissionTranslateLambda",
        "KendraNativeCrawlerGet",
      ],
      Properties: {
        ServiceToken: {Ref: "CFNLambda"},
        restApiId: {Ref: "Api"},
        buildDate: new Date(),
        stage: "prod",
        ApiDeploymentId: {Ref: "ApiDeploymentId"},
        Encryption: {Ref: "Encryption"},
      },
    },
    "ConnectGet": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "AWS_IAM",
        "HttpMethod": "GET",
        "RestApiId": {"Ref": "Api"},
        "ResourceId": {"Ref": "ConnectApiResource"},
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Join": [
              "",
              [
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":lambda:path/2015-03-31/functions/",
                {"Fn::GetAtt": ["ConnectLambda", "Arn"]},
                "/invocations"
              ]
            ]
          },
          "IntegrationResponses": [
            {
              "StatusCode": 200
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 200
          }
        ],
      }
    },
    "GenesysGet": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "AWS_IAM",
        "HttpMethod": "GET",
        "RestApiId": {"Ref": "Api"},
        "ResourceId": {"Ref": "GenesysApiResource"},
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Join": [
              "",
              [
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":lambda:path/2015-03-31/functions/",
                {"Fn::GetAtt": ["GenesysLambda", "Arn"]},
                "/invocations"
              ]
            ]
          },
          "IntegrationResponses": [
            {
              "StatusCode": 200
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 200
          }
        ],
      }
    },
    "SyncCodeVersion": {
      "Type": "Custom::S3Version",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "BootstrapBucket"},
        "Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/export.zip"},
        "BuildDate": (new Date()).toISOString()
      }
    },
    "ExportStepLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": {"Ref": "BootstrapBucket"},
          "S3Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/export.zip"},
          "S3ObjectVersion": {"Ref": "ExportCodeVersion"}
        },
        "Environment": {
          "Variables": {
            ES_INDEX: {"Ref": "VarIndex"},
            ES_ENDPOINT: {"Ref": "EsEndpoint"},
            ES_PROXY: {"Ref": "EsProxyLambda"}
          }
        },
        "Handler": "index.step",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["ExportRole", "Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"},
            {"Ref": "AWS::NoValue"}]
        },
        "Tags": [{
          Key: "Type",
          Value: "Export"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "ExportRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess()
        ],
        "Path": "/",
        "ManagedPolicyArns": [
          {"Ref": "ExportPolicy"}
        ]
      },
      "Metadata": util.cfnNag(["W11", "W12"])
    },
    "ExportPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObjectVersion",
                "s3:DeleteObject",
                "s3:GetObjectVersion"
            ],
            "Resource": [{"Fn::Sub": "arn:aws:s3:::${ExportBucket}*"}]
          }, {
            "Effect": "Allow",
            "Action": [
              "lambda:InvokeFunction"
            ],
            "Resource": [{"Ref": "EsProxyLambda"}]
          }]
        }
      }
    },
    "ExportClear": {
      "Type": "Custom::S3Clear",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "ExportBucket"}
      }
    },
    "KendraSyncLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": {"Ref": "BootstrapBucket"},
          "S3Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/export.zip"},
          "S3ObjectVersion": {"Ref": "SyncCodeVersion"}
        },
        "Environment": {
          "Variables": {
            "DEFAULT_SETTINGS_PARAM": {"Ref": "DefaultQnABotSettings"},
            "CUSTOM_SETTINGS_PARAM": {"Ref": "CustomQnABotSettings"},
            "OUTPUT_S3_BUCKET": {"Ref": "ExportBucket"},
            "KENDRA_ROLE": {"Fn::GetAtt": ["KendraS3Role", "Arn"]},
            "REGION": {"Ref": "AWS::Region"}
          }
        },
        "Layers":[
        {"Ref":"QnABotCommonLambdaLayer"}],
        "Handler": "kendraSync.performSync",
        "MemorySize": "1024",
        "Role": {"Fn::GetAtt": ["KendraSyncRole", "Arn"]},
        "Runtime": "nodejs12.x",
        "Timeout": 300,
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"},
            {"Ref": "AWS::NoValue"}]
        },
        "Tags": [{
          Key: "Type",
          Value: "Sync"
        }]
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "KendraSyncRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }, {
              "Effect": "Allow",
              "Principal": {
                "Service": "kendra.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess()
        ],
        "Path": "/",
        "ManagedPolicyArns": [
          {"Ref": "KendraSyncPolicy"}
        ]
      },
      "Metadata": util.cfnNag(["W11", "W12"])
    },
    "KendraSyncPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          // TODO: split the statements up
          "Statement": [{
            "Effect": "Allow",
            "Action": [
              "s3:PutObject",
              "s3:Get*",
              "s3:List*",
              "kendra:CreateFaq",
              "kendra:ListFaqs",
              "kendra:TagResource",
              "kendra:DeleteFaq",
              "kendra:DescribeFaq",
              "kendra:DetectPiiEntities",
              "iam:passRole",
              "ssm:getParameter"
            ],
            "Resource": [
              {"Fn::Sub": "arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*"},
              {"Fn::Sub": "arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*/faq/*"},
              {"Fn::Sub": "arn:aws:s3:::${ExportBucket}"},
              {"Fn::Sub": "arn:aws:s3:::${ExportBucket}/*"},
              {"Fn::GetAtt": ["KendraS3Role", "Arn"]},
              {"Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:*"}
            ]
          }]
        }
      }
    },
    "KendraS3Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }, {
              "Effect": "Allow",
              "Principal": {
                "Service": "kendra.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess(),
        ],
        "Path": "/",
        "ManagedPolicyArns": [
          {"Ref": "KendraS3Policy"}
        ]
      },
      "Metadata": util.cfnNag(["W11", "W12"])
    },
    TranslatePost: {
      Type: "AWS::ApiGateway::Method",
      Properties: {
        AuthorizationType: "AWS_IAM",
        HttpMethod: "POST",
        RestApiId: {Ref: "Api"},
        ResourceId: {Ref: "TranslateApiResource"},
        Integration: {
          Type: "AWS_PROXY",
          IntegrationHttpMethod: "POST",
          RequestTemplates: {
            "application/x-www-form-urlencoded": "{\"body\":$input.json('$')}",
          },
          Uri: {
            "Fn::Join": [
              "",
              [
                "arn:aws:apigateway:",
                {Ref: "AWS::Region"},
                ":lambda:path/2015-03-31/functions/",
                {"Fn::GetAtt": ["TranslateLambda", "Arn"]},
                "/invocations",
              ],
            ],
          },
          IntegrationResponses: [
            {
              StatusCode: 200,
            },
          ],
        },
        MethodResponses: [
          {
            StatusCode: 200,
          },
        ],
      },
    },
    TranslateRole: {
      Type: "AWS::IAM::Role",
      Properties: {
        AssumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        },
        Path: "/",
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole()
        ],
        ManagedPolicyArns: [
          {Ref: "TranslatePolicy"},
        ],
      },
      Metadata: util.cfnNag(["W11"])
    },
    TranslateCodeVersion: {
      Type: "Custom::S3Version",
      Properties: {
        ServiceToken: {Ref: "CFNLambda"},
        Bucket: {Ref: "BootstrapBucket"},
        Key: {"Fn::Sub": "${BootstrapPrefix}/lambda/translate.zip"},
        BuildDate: new Date().toISOString(),
      },
    },
    TranslateLambda: {
      Type: "AWS::Lambda::Function",
      Properties: {
        Code: {
          S3Bucket: {Ref: "BootstrapBucket"},
          S3Key: {"Fn::Sub": "${BootstrapPrefix}/lambda/translate.zip"},
          S3ObjectVersion: {Ref: "TranslateCodeVersion"},
        },
        Environment: {
          Variables: {
            outputBucket: {Ref: "ExportBucket"},
          },
        },
        Handler: "index.handler",
        MemorySize: "1024",
        Role: {"Fn::GetAtt": ["TranslateRole", "Arn"]},
        Runtime: "nodejs12.x",
        Timeout: 300,
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"}, {"Ref": "AWS::NoValue"}]
        },
        Tags: [
          {
            Key: "Type",
            Value: "Export",
          },
        ],
      },
      "Metadata": util.cfnNag(["W92"])
    },
    TranslatePolicy: {
      Type: "AWS::IAM::ManagedPolicy",
      Properties: {
        PolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "translate:ImportTerminology",
                "translate:ListTerminologies",
              ],
              Resource: ["*"],
            },
          ],
        },
      },
      Metadata: util.cfnNag(["W13"])
    },
    TranslateApiRootResource: {
      Type: "AWS::ApiGateway::Resource",
      Properties: {
        ParentId: {Ref: "ApiRootResourceId"},
        PathPart: "translate",
        RestApiId: {Ref: "Api"},
      },
    },
    TranslateApiResource: {
      Type: "AWS::ApiGateway::Resource",
      Properties: {
        ParentId: {Ref: "TranslateApiRootResource"},
        PathPart: "{proxy+}",
        RestApiId: {Ref: "Api"},
      },
    },
    InvokePermissionTranslateLambda: {
      Type: "AWS::Lambda::Permission",
      Properties: {
        Action: "lambda:InvokeFunction",
        FunctionName: {"Fn::GetAtt": ["TranslateLambda", "Arn"]},
        Principal: "apigateway.amazonaws.com",
      },
    },


    KendraTopicApiGateRole: {
      Type: "AWS::IAM::Role",
      Properties: {
        AssumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: ["apigateway.amazonaws.com"],
              },
              Action: ["sts:AssumeRole"],
            },
          ],
        },
        Path: "/",
        Policies: [
          {
            PolicyName: "GatewayRolePolicy",
            PolicyDocument: {
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: ["sns:Publish"],
                  Resource: {Ref: "KendraCrawlerSnsTopic"},
                },
                {
                  Effect: "Allow",
                  Action: [
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                  ],
                  Resource: [
                    {"Fn::Sub": "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:*"},
                    {"Fn::Sub": "arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:*:log-stream:*"}
                  ],
                },
              ],
            },
          },
        ],
      },
      Metadata: util.cfnNag(["W11"])
    },

    ParameterChangeRuleKendraCrawlerPermission: {
      Type: "AWS::Lambda::Permission",
      Properties: {
        FunctionName: {
          "Fn::GetAtt": ["KendraNativeCrawlerScheduleUpdateLambda", "Arn"],
        },
        Action: "lambda:InvokeFunction",
        Principal: "events.amazonaws.com",
        SourceArn: {
          "Fn::GetAtt": ["CloudWatchEventRule", "Arn"],
        },
      },
    },
    CloudWatchEventRule: {
      Type: "AWS::Events::Rule",
      Properties: {
        Description: "Parameter Setting Change",
        EventPattern: {
          source: ["aws.ssm"],
          "detail-type": ["Parameter Store Change"],
          detail: {
            name: [{Ref: "CustomQnABotSettings"}],
            operation: ["Update"],
          },
        },
        State: "ENABLED",
        Targets: [
          //Add Lambda targets here as needed
          {
            Arn: {
              "Fn::GetAtt": ["KendraNativeCrawlerScheduleUpdateLambda", "Arn"],
            },
            Id: "KendraCrawler",
          },
        ],
      },
    },
    

    KendraNativeCrawlerRole: {
      Type: "AWS::IAM::Role",
      Properties: {
        AssumeRolePolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "lambda.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
            {
              Effect: "Allow",
              Principal: {
                Service: "kendra.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            }
          ],
        },
        Path: "/",
        ManagedPolicyArns: [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          {"Ref":"KendraNativeCrawlerPolicy"},
        ],
      },
    },
    "KendraS3Policy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "kendra:CreateFaq",
            ],
            "Resource": [
              {"Fn::Sub": "arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*"},
              {"Fn::Sub": "arn:aws:s3:::${ExportBucket}"},
              {"Fn::Sub": "arn:aws:s3:::${ExportBucket}/*"},
            ]
          }]
        }
      }
    },
    "KendraNativeCrawlerGet": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "AWS_IAM",
        "HttpMethod": "GET",
        "RestApiId": {"Ref": "Api"},
        "ResourceId": {"Ref": "KendraNativeCrawlerApiResource"},
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Join": [
              "",
              [
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":lambda:path/2015-03-31/functions/",
                {"Fn::GetAtt": ["KendraNativeCrawlerStatusLambda", "Arn"]},
                "/invocations"
              ]
            ]
          },
          "IntegrationResponses": [
            {
              "StatusCode": 200
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 200
          }
        ],
      }
    },
    "KendraNativeCrawlerPost": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "AuthorizationType": "AWS_IAM",
        "HttpMethod": "POST",
        "RestApiId": {"Ref": "Api"},
        "ResourceId": {"Ref": "KendraNativeCrawlerApiResource"},
        "Integration": {
          "Type": "AWS",
          "IntegrationHttpMethod": "POST",
          "RequestParameters": {
            "integration.request.header.X-Amz-Invocation-Type": "'Event'"
          }, 
          "Uri": {
            "Fn::Join": [
              "",
              [
                "arn:aws:apigateway:",
                {"Ref": "AWS::Region"},
                ":lambda:path/2015-03-31/functions/",
                {"Fn::GetAtt": ["KendraNativeCrawlerLambda", "Arn"]},
                "/invocations"
              ]
            ]
          },
          "IntegrationResponses": [
            {
              "StatusCode": 200
            }
          ]
        },
        "MethodResponses": [
          {
            "StatusCode": 200
          }
        ],
      }
    },
    "KendraNativeCrawlerCodeVersion": {
      "Type": "Custom::S3Version",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "BootstrapBucket"},
        "Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/kendra-webcrawler.zip"},
        "BuildDate": (new Date()).toISOString()
      }
    },
    "KendraNativeCrawlerStatusCodeVersion": {
      "Type": "Custom::S3Version",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "BootstrapBucket"},
        "Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/kendra-webcrawler-status.zip"},
        "BuildDate": (new Date()).toISOString()
      }
    },
    "KendraNativeCrawlerApiResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "ParentId": {"Ref": "ApiRootResourceId"},
        "PathPart": "kendranativecrawler",
        "RestApiId": {"Ref": "Api"}
      }
    },
    "KendraNativeCrawlerInvokePermissionConnectLambda": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {"Fn::GetAtt": ["KendraNativeCrawlerLambda", "Arn"]},
        "Principal": "apigateway.amazonaws.com"
      }
    },
    KendraNativeCrawlerLambda: {
      Type: "AWS::Lambda::Function",
      Properties: {
        Code: {
          S3Bucket: {Ref: "BootstrapBucket"},
          S3Key: {"Fn::Sub": "${BootstrapPrefix}/lambda/kendra-webcrawler.zip"},
          S3ObjectVersion: {Ref: "KendraNativeCrawlerCodeVersion"},
        },
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"}, {"Ref": "AWS::NoValue"}]
        },
        Environment: {
          Variables: {
            DEFAULT_SETTINGS_PARAM: {Ref: "DefaultQnABotSettings"},
            CUSTOM_SETTINGS_PARAM: {Ref: "CustomQnABotSettings"},
            ROLE_ARN: {"Fn::GetAtt" : ["KendraNativeCrawlerPassRole", "Arn"] },
            DATASOURCE_NAME: {
              "Fn::Join": [
                "-",
                [
                  "QNABotKendraNativeCrawler",
                  {
                    "Fn::Select": [
                      2,
                      {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
                    ],
                  },"v2"
                ],
              ],
            },
            DASHBOARD_NAME: {
              "Fn::Join": [
                "-",
                [
                  "QNABotKendraDashboard",
                  {
                    "Fn::Select": [
                      2,
                      {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
                    ],
                  },"v2"
                ],
              ],
            },
          },
        },
        Handler: "kendra_webcrawler.handler",
        MemorySize: "2048",
        Role: {"Fn::GetAtt": ["KendraNativeCrawlerRole", "Arn"]},
        Runtime: "python3.7",
        Timeout: 900,
        Tags: [
          {
            Key: "Type",
            Value: "Export",
          },
        ],
      },
      "Metadata": util.cfnNag(["W92"])
    },
    "KendraNativeCrawlerLambdaStatusInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName": {"Fn::GetAtt": ["KendraNativeCrawlerStatusLambda", "Arn"]},
        "Principal": "apigateway.amazonaws.com"
      }
    },
    "KendraNativeCrawlerScheduleUpdateCodeVersion": {
      "Type": "Custom::S3Version",
      "Properties": {
        "ServiceToken": {"Ref": "CFNLambda"},
        "Bucket": {"Ref": "BootstrapBucket"},
        "Key": {"Fn::Sub": "${BootstrapPrefix}/lambda/kendra-webcrawler-schedule-updater.zip"},
        "BuildDate": (new Date()).toISOString()
      }
    },
    KendraNativeCrawlerScheduleUpdateLambda: {
      Type: "AWS::Lambda::Function",
      Properties: {
        Code: {
          S3Bucket: {Ref: "BootstrapBucket"},
          S3Key: {"Fn::Sub": "${BootstrapPrefix}/lambda/kendra-webcrawler-schedule-updater.zip"},
          S3ObjectVersion: {Ref: "KendraNativeCrawlerScheduleUpdateCodeVersion"},
        },
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"}, {"Ref": "AWS::NoValue"}]
        },
        Environment: {
          Variables: {
            ROLE_ARN: {"Fn::GetAtt": ["KendraNativeCrawlerPassRole", "Arn"]},
            DEFAULT_SETTINGS_PARAM: {Ref: "DefaultQnABotSettings"},
            CUSTOM_SETTINGS_PARAM: {Ref: "CustomQnABotSettings"},
            DATASOURCE_NAME: {
              "Fn::Join": [
                "-",
                [
                  "QNABotKendraNativeCrawler",
                  {
                    "Fn::Select": [
                      2,
                      {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
                    ],
                  },"v2"
                ],
              ],
            },
          },
        },
        Handler: "kendra_webcrawler_schedule_updater.handler",
        MemorySize: "2048",
        Role: {"Fn::GetAtt": ["KendraNativeCrawlerRole", "Arn"]},
        Runtime: "python3.7",
        Timeout: 900,
        Tags: [
          {
            Key: "Type",
            Value: "Export",
          },
        ],
      },
      "Metadata": util.cfnNag(["W92"])
    },
    KendraNativeCrawlerStatusLambda: {
      Type: "AWS::Lambda::Function",
      Properties: {
        Code: {
          S3Bucket: {Ref: "BootstrapBucket"},
          S3Key: {"Fn::Sub": "${BootstrapPrefix}/lambda/kendra-webcrawler-status.zip"},
          S3ObjectVersion: {Ref: "KendraNativeCrawlerStatusCodeVersion"},
        },
        "VpcConfig": {
          "Fn::If": ["VPCEnabled", {
            "SubnetIds": {"Fn::Split": [",", {"Ref": "VPCSubnetIdList"}]},
            "SecurityGroupIds": {"Fn::Split": [",", {"Ref": "VPCSecurityGroupIdList"}]},
          }, {"Ref": "AWS::NoValue"}]
        },
        "TracingConfig": {
          "Fn::If": ["XRAYEnabled", {"Mode": "Active"}, {"Ref": "AWS::NoValue"}]
        },
        Environment: {
          Variables: {
            DEFAULT_SETTINGS_PARAM: {Ref: "DefaultQnABotSettings"},
            CUSTOM_SETTINGS_PARAM: {Ref: "CustomQnABotSettings"},
            DATASOURCE_NAME: {
              "Fn::Join": [
                "-",
                [
                  "QNABotKendraNativeCrawler",
                  {
                    "Fn::Select": [
                      2,
                      {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
                    ],
                  },"v2"
                ],
              ],
            },
            DASHBOARD_NAME: {
              "Fn::Join": [
                "-",
                [
                  "QNABotKendraDashboard",
                  {
                    "Fn::Select": [
                      2,
                      {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
                    ],
                  },"v2"
                ],
              ],
            },
          },
        },
        Handler: "kendra_webcrawler_status.handler",
        MemorySize: "2048",
        Role: {"Fn::GetAtt": ["KendraNativeCrawlerRole", "Arn"]},
        Runtime: "python3.7",
        Timeout: 900,
        Tags: [
          {
            Key: "Type",
            Value: "Export",
          },
        ],
      },
      "Metadata": util.cfnNag(["W92"])
    },
    KendraNativeCrawlerPassRole: {
      Type: "AWS::IAM::Role",
      Properties: {
        AssumeRolePolicyDocument: {
          Version: "2012-10-17",
          "Statement": [
            {
              "Sid": "",
              "Effect": "Allow",
              "Principal": {
                "Service": "kendra.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            },
            {
              "Sid": "",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ],
        },
        Path: "/",
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole()
        ],
        ManagedPolicyArns: [
          {Ref: "KendraNativeCrawlerPassPolicy"},
        ],
      },
      Metadata: util.cfnNag(["W11"])
    },
    KendraNativeCrawlerPolicy: {
      Type: "AWS::IAM::ManagedPolicy",
      Properties: {
        PolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: "cloudwatch:PutDashboard",
              Resource: [{"Fn::Sub": "arn:${AWS::Partition}:cloudwatch::${AWS::AccountId}:dashboard/QNA*"}]
            },
            {
              Effect: "Allow",
              Action: [
                "kendra:ListDataSources",
                "kendra:ListDataSourceSyncJobs",
                "kendra:DescribeDataSource",
                "kendra:CreateDataSource",
                "kendra:StartDataSourceSyncJob",
                "kendra:StopDataSourceSyncJob",
                "kendra:UpdateDataSource",

              ],
              Resource: [
                {"Fn::Sub": "arn:${AWS::Partition}:kendra:${AWS::Region}:${AWS::AccountId}:index/*"},
                {"Fn::Sub": "arn:${AWS::Partition}:kendra:${AWS::Region}:${AWS::AccountId}:index/*/data-source/*"}
              ],
            },
            {
              Effect: "Allow",
              Action: [
                "ssm:GetParameter",
              ],
              Resource: [
                {"Fn::Join": ["", ["arn:aws:ssm:", {"Ref": "AWS::Region"}, ":", {"Ref": "AWS::AccountId"}, ":parameter/", {"Ref": "CustomQnABotSettings"}]]},
                {"Fn::Join": ["", ["arn:aws:ssm:", {"Ref": "AWS::Region"}, ":", {"Ref": "AWS::AccountId"}, ":parameter/", {"Ref": "DefaultQnABotSettings"}]]},
              ],
            },
            {
              "Effect": "Allow",
              "Action": "iam:PassRole",
              "Resource": {"Fn::GetAtt":["KendraNativeCrawlerPassRole","Arn"]}
          },
          ],
        },
      },
      Metadata: util.cfnNag(["W11"])
    },
    KendraNativeCrawlerPassPolicy: {
      Type: "AWS::IAM::ManagedPolicy",
      Properties: {
        PolicyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
                "Effect": "Allow",
                "Action": [
                    "kendra:BatchPutDocument",
                    "kendra:BatchDeleteDocument"
                ],
                "Resource":{"Fn::Sub":"arn:aws:kendra:${AWS::Region}:${AWS::AccountId}:index/*"}
            }
        ],
        },
      },
    },
  }
);
