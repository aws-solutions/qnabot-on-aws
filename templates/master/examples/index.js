var fs=require('fs')
var _=require('lodash')
var fs=require('fs')

var js=fs.readdirSync(`${__dirname}/js`)
.map(file=>{
    var name=file.match(/(.*).js/)[1]
    return {
        name:`ExampleJSLambda${name}`,
        resource:jslambda(name),
        id:name
    }
})

var py=fs.readdirSync(`${__dirname}/py`)
.map(file=>{
    var name=file.match(/(.*).py/)[1]
    return {
        name:`ExamplePYTHONLambda${name}`,
        resource:pylambda(name),
        id:name
    }
})


module.exports=Object.assign(
    _.fromPairs(js.map(x=>[x.name,x.resource])),
    _.fromPairs(py.map(x=>[x.name,x.resource])),
    {
    "LambdaHookExamples":{
        "Condition":"BuildExamples",
        "Type": "Custom::QnABotExamples",
        "Properties": Object.assign(
            _.fromPairs(js.map(x=>[x.id,{"Ref":x.name}]))
        ,{
            "ServiceToken": { "Fn::GetAtt" : ["ExampleWriteLambda", "Arn"] },
            "photos":{"Fn::Sub":"${ApiUrl.Name}/examples/photos"},
            "Bucket": {"Ref":"AssetBucket"},
            "version":{"Ref":"ExampleCodeVersion"}
        })
    },
    "ExampleCodeVersion":{
        "Condition":"BuildExamples",
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/examples.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "ExampleWriteLambda":{
      "Condition":"BuildExamples",
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
        "Handler": "cfn.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"CustomResource"
        }]
      }
    },
    "ExampleLambdaRole":{
      "Type": "AWS::IAM::Role",
      "Condition":"BuildExamples",
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
    },
    "PushFirehoseExecuteQNALambda":{
      "Type" : "AWS::IAM::Policy",
      "Properties" : { 
        "PolicyDocument" : {
          "Version": "2012-10-17",
          "Statement": [
              {
                "Effect": "Allow",
                "Action": [
                  "lambda:InvokeFunction"
                ],
                "Resource": [
                  {"Fn::Join": ["",["arn:aws:lambda:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":function:qna-*"]]},
                  {"Fn::Join": ["",["arn:aws:lambda:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":function:QNA-*"]]},
                ]
              },
              {
                "Effect": "Allow",
                "Action": [
                  "firehose:PutRecord",
                  "firehose:PutRecordBatch"
                ],
                "Resource": [
                  {"Fn::GetAtt" : ["MetricFirehose", "Arn"]}
                ]
              }
          ]
        },
        "PolicyName" : "LambdaMetricFirehoseQNALambda",
        "Roles" : [{"Ref":"ExampleLambdaRole"}],
      }
    }
})
function jslambda(name){
    return {
      "Type": "AWS::Lambda::Function",
      "Condition":"BuildExamples",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/lambda/examples.zip"
            ]]},
            "S3ObjectVersion":{"Ref":"ExampleCodeVersion"}
        },
        "Environment": {
          "Variables": {
            "ES_TYPE": {"Fn::GetAtt":["Var","type"]},
            "ES_INDEX": {"Fn::GetAtt":["Var","index"]},
            "FIREHOSE_NAME":{"Ref":"MetricFirehose"},
            "ES_ADDRESS": {"Fn::GetAtt":["ESVar","ESAddress"]},
          }
        },
        "FunctionName":{"Fn::Sub":`qna-\${AWS::StackName}-${name}-JS`},
        "Handler":`js/${name}.handler`,
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["ExampleLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"Example"
        }]
      }
    }
}
function pylambda(name){
    return {
      "Type": "AWS::Lambda::Function",
      "Condition":"BuildExamples",
      "Properties": {
        "Code": {
            "S3Bucket": {"Ref":"BootstrapBucket"},
            "S3Key": {"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/lambda/examples.zip"
            ]]},
            "S3ObjectVersion":{"Ref":"ExampleCodeVersion"}
        },
        "Environment": {
          "Variables": {
            "ES_TYPE": {"Fn::GetAtt":["Var","type"]},
            "ES_INDEX": {"Fn::GetAtt":["Var","index"]},
            "FIREHOSE_NAME":{"Ref":"MetricFirehose"},
            "ES_ADDRESS": {"Fn::GetAtt":["ESVar","ESAddress"]},
          }
        },
        "FunctionName":{"Fn::Sub":`qna-\${AWS::StackName}-${name}-PY`},
        "Handler":`py/${name}.handler`,
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["ExampleLambdaRole","Arn"]},
        "Runtime": "python3.6",
        "Timeout": 300,
        "Tags":[{
            Key:"Type",
            Value:"Example"
        }]
      }
    }
}
