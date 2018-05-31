var fs=require('fs')
var _=require('lodash')
var fs=require('fs')

var js=fs.readdirSync(`${__dirname}/js`)
.filter(x=>x.match(/(.*).js/))
.map(file=>{
    var name=file.match(/(.*).js/)[1]
    return {
        name:`ExampleJSLambda${name}`,
        resource:jslambda(name),
        id:`${name}JS`
    }
})

var py=fs.readdirSync(`${__dirname}/py`)
.filter(x=>x.match(/(.*).py/))
.map(file=>{
    var name=file.match(/(.*).py/)[1]
    return {
        name:`ExamplePYTHONLambda${name}`,
        resource:pylambda(name),
        id:`${name}PY`
    }
})


module.exports=Object.assign(
    _.fromPairs(js.map(x=>[x.name,x.resource])),
    _.fromPairs(py.map(x=>[x.name,x.resource])),
    {
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
              "Resource":js.concat(py)
                .map(x=>{ return {"Fn::GetAtt":[x.name,"Arn"]}})
            }]
        },
        "Roles": [{"Ref": "FulfillmentLambdaRole"}]
      }
    },
    "QuizKey":{
        "Type" : "AWS::KMS::Key",
        "Properties":{
			KeyPolicy:{
				"Version": "2012-10-17",
				"Id": "key-default-1",
				"Statement": [
					{
					"Sid": "Allow administration of the key",
					"Effect": "Allow",
					"Principal": { "AWS": {"Ref":"AWS::AccountId"} },
					"Action": [
						"kms:*"
					],
					"Resource": "*"
					},
					{
						"Sid": "Enable IAM User Permissions",
						"Effect": "Allow",
						"Principal": {"AWS": 
                            {"Fn::Sub":"arn:aws:iam::${AWS::AccountId}:root"}
						},
						"Action": "kms:*",
						"Resource": "*"
					}
				]
			}                
        }
    },
    "LambdaHookExamples":{
        "Type": "Custom::QnABotExamples",
        "Properties": Object.assign(
            _.fromPairs(js.map(x=>[x.id,{"Ref":x.name}])),
            _.fromPairs(py.map(x=>[x.id,{"Ref":x.name}]))
        ,{
            "ServiceToken": { "Fn::GetAtt" : ["ExampleWriteLambda", "Arn"] },
            "photos":{"Fn::Sub":"${ApiUrlName}/examples/photos"},
            "Bucket": {"Ref":"AssetBucket"},
            "version":{"Ref":"ExampleCodeVersion"}
        })
    },
    "ExampleCodeVersion":{
        "Type": "Custom::S3Version",
        "Properties": {
            "ServiceToken": {"Ref":"CFNLambda"},
            "Bucket": {"Ref":"BootstrapBucket"},
            "Key": {"Fn::Sub":"${BootstrapPrefix}/lambda/examples.zip"},
            "BuildDate":(new Date()).toISOString()
        }
    },
    "ExampleWriteLambda":{
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
        "Role":{"Ref":"CFNLambdaRole"} ,
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
        "Policies":[{ 
          "PolicyName" : "LambdaFeedbackFirehoseQNALambda",
          "PolicyDocument" : {
          "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
						"kms:Encrypt",
						"kms:Decrypt",
					], 
					"Resource":{"Fn::GetAtt":["QuizKey","Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": [
                    {"Fn::Join": ["",["arn:aws:lambda:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":function:qna-*"]]},
                    {"Fn::Join": ["",["arn:aws:lambda:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":function:QNA-*"]]},
                    {"Ref":"QIDLambdaArn"} 
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "firehose:PutRecord",
                    "firehose:PutRecordBatch"
                  ],
                  "Resource": [
                    {"Ref":"FeedbackFirehose"}
                  ]
                }
            ]
          }
        }],
        "ManagedPolicyArns": [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"]
      }
    }
})
function jslambda(name){
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
        "Environment": {
          "Variables": {
            "ES_QNA_TYPE": {"Ref":"QnAType"},
            "ES_QUIZE_TYPE": {"Ref":"QuizType"},
            "ES_INDEX": {"Ref":"Index"},
            "FIREHOSE_NAME":{"Ref":"FeedbackFirehoseName"},
            "ES_ADDRESS": {"Ref":"ESAddress"},
            "QUIZ_KMS_KEY":{"Ref":"QuizKey"}
          }
        },
        "Handler":`js/${name}.handler`,
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["ExampleLambdaRole","Arn"]},
        "Runtime": "nodejs8.10",
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
            "ES_QNA_TYPE": {"Ref":"QnAType"},
            "ES_QUIZE_TYPE": {"Ref":"QuizType"},
            "ES_INDEX": {"Ref":"Index"},
            "FIREHOSE_NAME":{"Ref":"FeedbackFirehoseName"},
            "ES_ADDRESS": {"Ref":"ESAddress"},
            "QUIZ_KMS_KEY":{"Ref":"QuizKey"}
          }
        },
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
