module.exports = {
  CommonModulesLayerCodeVersion: {
    Type: "Custom::S3Version",
    Properties: {
      ServiceToken: { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      Bucket: { Ref: "BootstrapBucket" },
      Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/common-modules-layer.zip" },
      BuildDate: new Date().toISOString(),
    },
  },
  CommonModulesLambdaLayer: {
    Type: "AWS::Lambda::LayerVersion",
    Properties: {
      LayerName:{
        "Fn::Join": [
          "-",
          [
            "CommonModules",
            {
              "Fn::Select": [
                2,
                {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
              ],
            },
          ],
        ],
      },
      Content: {
        S3Bucket: { Ref: "BootstrapBucket" },
        S3Key: {
          "Fn::Sub": "${BootstrapPrefix}/lambda/common-modules-layer.zip",
        },
        S3ObjectVersion: { Ref: "CommonModulesLayerCodeVersion" },
      },
      CompatibleRuntimes: ["nodejs12.x"],
    },
  },
  QnABotCommonLayerCodeVersion: {
    Type: "Custom::S3Version",
    Properties: {
      ServiceToken: { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      Bucket: { Ref: "BootstrapBucket" },
      Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/qnabot-common-layer.zip" },
      BuildDate: new Date().toISOString(),
    },
  },
  QnABotCommonLambdaLayer: {
    Type: "AWS::Lambda::LayerVersion",
    Properties: {
      LayerName:{
        "Fn::Join": [
          "-",
          [
            "QnABotCommon",
            {
              "Fn::Select": [
                2,
                {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
              ],
            },
          ],
        ],
      },
      Content: {
        S3Bucket: { Ref: "BootstrapBucket" },
        S3Key: {
          "Fn::Sub": "${BootstrapPrefix}/lambda/qnabot-common-layer.zip",
        },
        S3ObjectVersion: { Ref: "QnABotCommonLayerCodeVersion" },
      },
      CompatibleRuntimes: ["nodejs12.x"],
    },
  },
  AwsSdkLayerCodeVersion: {
    Type: "Custom::S3Version",
    Properties: {
      ServiceToken: { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      Bucket: { Ref: "BootstrapBucket" },
      Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/aws-sdk-layer.zip" },
      BuildDate: new Date().toISOString(),
    },
  },
  AwsSdkLayerLambdaLayer: {
    Type: "AWS::Lambda::LayerVersion",
    Properties: {
      Content: {
        S3Bucket: { Ref: "BootstrapBucket" },
        S3Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/aws-sdk-layer.zip" },
        S3ObjectVersion: { Ref: "AwsSdkLayerCodeVersion" },
      },
      LayerName:{
        "Fn::Join": [
          "-",
          [
            "AwsSdk",
            {
              "Fn::Select": [
                2,
                {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
              ],
            },
          ],
        ],
      },
      CompatibleRuntimes: ["nodejs12.x"],
    },
  },
  CfnLambdaLayerCodeVersion: {
    Type: "Custom::S3Version",
    Properties: {
      ServiceToken: { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      Bucket: { Ref: "BootstrapBucket" },
      Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/cfn-lambda-layer.zip" },
      BuildDate: new Date().toISOString(),
    },
  },
  CfnLambdaLayer: {
    Type: "AWS::Lambda::LayerVersion",
    Properties: {
      LayerName:{
        "Fn::Join": [
          "-",
          [
            "CfnLambdaModule",
            {
              "Fn::Select": [
                2,
                {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
              ],
            },
          ],
        ],
      },
      Content: {
        S3Bucket: { Ref: "BootstrapBucket" },
        S3Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/cfn-lambda-layer.zip" },
        S3ObjectVersion: { Ref: "CfnLambdaLayerCodeVersion" },
      },
      CompatibleRuntimes: ["nodejs12.x"],
    },
  },
  EsProxyLayerCodeVersion: {
    Type: "Custom::S3Version",
    Properties: {
      ServiceToken: { "Fn::GetAtt": ["CFNLambda", "Arn"] },
      Bucket: { Ref: "BootstrapBucket" },
      Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/es-proxy-layer.zip" },
      BuildDate: new Date().toISOString(),
    },
  },
  EsProxyLambdaLayer: {
    Type: "AWS::Lambda::LayerVersion",
    Properties: {
      LayerName:{
        "Fn::Join": [
          "-",
          [
            "EsProxy",
            {
              "Fn::Select": [
                2,
                {"Fn::Split": ["-", {Ref: "DefaultQnABotSettings"}]},
              ],
            },
          ],
        ],
      },
      Content: {
        S3Bucket: { Ref: "BootstrapBucket" },
        S3Key: { "Fn::Sub": "${BootstrapPrefix}/lambda/es-proxy-layer.zip" },
        S3ObjectVersion: { Ref: "EsProxyLayerCodeVersion" },
      },
      CompatibleRuntimes: ["nodejs12.x"],
    },
  },
};
