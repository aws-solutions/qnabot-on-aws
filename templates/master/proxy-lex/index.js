var fs=require('fs')

module.exports={
    "LexProxyLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/handler.js','utf8')
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["LexProxyLambdaRole","Arn"]},
        "Runtime": "nodejs10.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Api"
        }]
      }
    },
    "LexStatusLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+'/status.js','utf8')
        },
        "Environment": {
            "Variables":{
                STATUS_KEY:"status.json",
                STATUS_BUCKET:{"Ref":"BuildStatusBucket"},
                BOT_NAME:{"Ref":"LexBot"},
            }
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["LexProxyLambdaRole","Arn"]},
        "Runtime": "nodejs10.x",
        "Timeout": 300,
        "VpcConfig" : {
            "Fn::If": [ "VPCEnabled", {
                "SubnetIds": {"Ref": "VPCSubnetIdList"},
                "SecurityGroupIds": {"Ref": "VPCSecurityGroupIdList"}
            }, {"Ref" : "AWS::NoValue"} ]
        },
        "TracingConfig" : {
            "Fn::If": [ "XRAYEnabled", {"Mode": "Active"},
                {"Ref" : "AWS::NoValue"} ]
        },
        "Tags":[{
            Key:"Type",
            Value:"Api"
        }]
      }
    },
    "LexProxyLambdaRole": {
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/AmazonLexFullAccess",
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
        ],
        "Policies":[{
            "PolicyName":"Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:Get*"
                    ],
                    "Resource":[{"Fn::Sub":"arn:aws:s3:::${BuildStatusBucket}*"}]
              }]
            }
        }]
      }
    }
}

