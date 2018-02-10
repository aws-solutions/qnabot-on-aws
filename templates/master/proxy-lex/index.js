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
        "Runtime": "nodejs6.10",
        "Timeout": 300,
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
          "arn:aws:iam::aws:policy/AmazonLexFullAccess"
        ]
      }
    }
}

