var fs=require('fs')

module.exports={
    "LexBuildLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket": {"Ref":"BootstrapBucket"},
          "S3Key": {"Fn::Join":["",[
            {"Ref":"BootstrapPrefix"},
            "/lambda/lex-build.zip"
          ]]}
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["LexBuildLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300
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
        "Path": "/",
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          {"Ref":"EsPolicy"},
          "arn:aws:iam::aws:policy/AmazonLexFullAccess"
        ]
      }
    }
}

