module.exports={
    "Alexa":{
      "Type" : "AWS::Lambda::Permission",
      "Properties" : {
        "Action" : "lambda:InvokeFunction",
        "FunctionName" : {"Fn::GetAtt":["HandlerLambda","Arn"]},
        "Principal" : "alexa-appkit.amazon.com"
      }
    },
    "HandlerCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/fulfillment.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "HandlerLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/fulfillment.zip"},
            "S3ObjectVersion":{"Ref":"HandlerCodeVersion"}
        },
        "Environment": {
          "Variables": {
            "REGION":{"Ref":"AWS::REGION" },
            "ES_TYPE": {"Ref": "Type"},
            "ES_INDEX": {"Ref": "Index"},
            "ES_ADDRESS": {"Ref": "Address"},
            "REGION": {"Ref": "AWS::Region"},
            "ERRORMESSAGE":{"Ref":"ErrorMessage"},
            "EMPTYMESSAGE":{"Ref":"EmptyMessage"}
          }
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {
          "Fn::GetAtt": [
            "LambdaRole",
            "Arn"
          ]
        },
        "Runtime": "nodejs6.10",
        "Timeout": 300
      }
    },
    "InvokePolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                "lambda:InvokeFunction"
              ],
              "Resource":[
                "arn:aws:lambda:*:*:function:qna-*",
                "arn:aws:lambda:*:*:function:QNA-*"
              ]
            }]
        },
        "Roles": [{"Ref": "LambdaRole"}]
      }
    },
    "EsPolicy": {
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "es:*"
              ],
              "Resource": [
                {
                  "Fn::Join": [
                    "/",
                    [
                      {
                        "Ref": "DomainArn"
                      },
                      "*"
                    ]
                  ]
                }
              ]
            },
            {
              "Effect": "Allow",
              "Action": ["lex:*"],
              "Resource": ["*"]
            }
          ]
        },
        "Roles": [{"Ref": "LambdaRole"}]
      }
    },
    "LambdaRole": {
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
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ]
      }
    }
}

