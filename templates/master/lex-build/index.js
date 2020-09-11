var fs=require('fs')
var _=require('lodash')

module.exports={
    "LexBuildLambda":lambda({
        "S3Bucket": {"Ref":"BootstrapBucket"},
        "S3Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/lex-build.zip"},
        "S3ObjectVersion":{"Ref":"LexBuildCodeVersion"}
    },{
        UTTERANCE_BUCKET:{"Ref":"AssetBucket"},
        UTTERANCE_KEY:"default-utterances.json",
        POLL_LAMBDA:{"Fn::GetAtt":["LexBuildLambdaPoll","Arn"]},
        STATUS_BUCKET:{"Ref":"BuildStatusBucket"},
        STATUS_KEY:"status.json",
        BOTNAME:{"Ref":"LexBot"},
        BOTALIAS:{"Ref":"VersionAlias"},
        SLOTTYPE:{"Ref":"SlotType"},
        INTENT:{"Ref":"Intent"},
        INTENTFALLBACK:{"Ref":"IntentFallback"},
        ADDRESS:{"Fn::Join" : [ "", [ "https://", {"Fn::GetAtt":["ESVar","ESAddress"]} ] ] },
        INDEX:{"Fn::GetAtt":["Var","index"]},
    },"nodejs10.x"),
    "LexBuildLambdaStart":lambda({
        "ZipFile":fs.readFileSync(__dirname+'/start.js','utf8')
    },{
        STATUS_BUCKET:{"Ref":"BuildStatusBucket"},
        STATUS_KEY:"status.json",
        BUILD_FUNCTION:{"Fn::GetAtt":["LexBuildLambda","Arn"]}
    }),
    "LexBuildLambdaPoll":lambda({
        "ZipFile":fs.readFileSync(__dirname+'/poll.js','utf8')
    },{
        STATUS_KEY:"status.json",
        STATUS_BUCKET:{"Ref":"BuildStatusBucket"},
        BOT_NAME:{"Ref":"LexBot"},
    }),
    "LexBuildCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/lex-build.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "LexBuildInvokePolicy": {
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
                {"Fn::GetAtt":["LexBuildLambda","Arn"]},
                {"Fn::GetAtt":["LexBuildLambdaPoll","Arn"]}
              ]
            }]
        },
        "Roles": [{"Ref": "LexBuildLambdaRole"}]
      }
    },
    "LexBuildLambdaRole": {
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
        "Policies":[{
            PolicyName:"AssetBucketAccess",
            PolicyDocument:{
                "Version" : "2012-10-17",
                "Statement": [ {
                    "Effect": "Allow",
                    "Action": ["s3:Get*"],
                    "Resource":[
                        {"Fn::Sub":"arn:aws:s3:::${AssetBucket}*"},
                        {"Fn::Sub":"arn:aws:s3:::${BuildStatusBucket}*"}
                    ]
                },{
                    "Effect": "Allow",
                    "Action": ["s3:Put*"],
                    "Resource":[
                        {"Fn::Sub":"arn:aws:s3:::${BuildStatusBucket}*"}
                    ]
                }]
            }
        }],
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
          {"Ref":"QueryPolicy"},
          "arn:aws:iam::aws:policy/AmazonLexFullAccess"
        ]
      }
    },
    "BuildStatusBucket":{
        "Type" : "AWS::S3::Bucket",
        "Properties":{
            LifecycleConfiguration:{
                Rules:[{
                    NoncurrentVersionExpirationInDays:1,
                    Status:"Enabled"
                },{
                    AbortIncompleteMultipartUpload:{
                        DaysAfterInitiation:1
                    },
                    Status:"Enabled"
                }]
            },
            "VersioningConfiguration":{
                "Status":"Enabled"
            },
            "BucketEncryption": {
                "Fn::If": [
                    "Encrypted",
                    {
                        "ServerSideEncryptionConfiguration": [{
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }]
                    },
                    {
                        "Ref": "AWS::NoValue"
                    }
                ]
            }
        }
    },
    "BuildStatusClear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNInvokePolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"BuildStatusBucket"}
        }
    }
}

function lambda(code,variable={},runtime="nodejs10.x"){
    return {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code":code,
        "Environment": {
            "Variables":variable
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["LexBuildLambdaRole","Arn"]},
        "Runtime":runtime,
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
    }
}
