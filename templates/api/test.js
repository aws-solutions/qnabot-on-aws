var stack=require('../util').stacktest
module.exports={
  "Resources": {
    "api":stack('api',{
        "HandlerArn":{"Fn::GetAtt":["lambda","Arn"]},
        "Botname":"bot",
        "SlotType":"slot",
        "Intent":"intent",
        "Email":"jcalho@amazon.com",
        "Utterances":"ad",
        "PublicOrPrivate":"PRIVATE",
        "ApprovedDomain":"amazon.com"
    }),
	"lambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Handler": "index.handler",
        "Role":{"Fn::GetAtt":["Role","Arn"]},
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "exports.handler = function(event, context,cb) {",
                "  console.log(event);",
                "  cb(null)",
                "};"
              ]
            ]
          }
        },
        "Runtime": "nodejs4.3"
      }
    },
    "Role": {
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
  },
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Test of the QnABot API template"
}
