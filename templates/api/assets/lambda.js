var fs=require('fs')

module.exports={
    "ExampleHookLambda1":lambda('example1'),
    "ExampleLambdaRole":{
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
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
      }
    }
}

function lambda(name){
    return {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/lambda/examples.zip"
            ]]},
            "S3ObjectVersion":{"Ref":"ExampleCodeVersion"}
        },
        "Handler":`index.${name}`,
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["ExampleLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300
      }
    }
}
