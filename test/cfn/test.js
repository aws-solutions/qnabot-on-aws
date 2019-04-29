var fs=require('fs')
var Promise=require('bluebird')
var child=Promise.promisifyAll(require('child_process'))
var JSZip = require("jszip");
var zip=new JSZip()
var package=require('../../package.json')
zip.file('buildspec.yml',fs.readFileSync(__dirname+'/buildspec.yml','utf-8'))
zip.file('Dockerfile',fs.readFileSync(__dirname+'/Dockerfile','utf-8'))

var tag="test"
var source="source.zip"
async function run(){
    var buff=await Promise.resolve(zip.generateAsync({type:'nodebuffer'}))
    var info=await child.execAsync('git rev-parse --symbolic-full-name --abbrev-ref @{u}',{
        cwd:__dirname
    })
    var info_parse=info.match(/(.*)\/(.*)/)
    var remote=info_parse[1]
    var branch=info_parse[2]

    var remote_info=await child.execAsync(`git remote get-url ${remote}`,{
        cwd:__dirname
    })

    var path=remote_info.match(/(.*):(.*)/)[2]
    var url=`https://github.com/${path}`

    return {
       "Description": "This template creates test infastructure for testing QnABot",
       "Resources":{
        "Repo":{
            "Type" : "AWS::ECR::Repository",
            "Properties":{
                RepositoryPolicyText:{
					"Version": "2012-10-17",
                        "Statement": [{
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "codebuild.amazonaws.com"  
                        },
                        "Action": [
                            "ecr:GetDownloadUrlForLayer",
                            "ecr:BatchGetImage",
                            "ecr:BatchCheckLayerAvailability"
                        ]
                    }]
                }
            }
        },
        "testBuild":{
            "Type":"AWS::CodeBuild::Project",
            "Properties":{
                "Artifacts":{
                    Type:"S3",
                    Location:{"Ref":"Bucket"}
                },
                "Environment":{
                    ComputeType:"BUILD_GENERAL1_LARGE",
                    Image:{"Fn::Sub":"${AWS::AccountId}.dkr.ecr.${AWS::Region}.amazonaws.com/${Repo}:"+tag},
                    EnvironmentVariables:[],
                    Type:"LINUX_CONTAINER"
                },
                "Name":{"Fn::Sub":"${AWS::StackName}-test-build"},
                ServiceRole:{"Ref":"TestServiceRole"},
                Source:{
                    Type:"GITHUB",
                    Location:url,
                    Auth:{
                        Type:"OAUTH"
                    }
                },
                TimeoutInMinutes:4*60
            }
        },
        "ImageBuild":{
            "Type":"AWS::CodeBuild::Project",
            "Properties":{
                "Artifacts":{
                    Type:"NO_ARTIFACTS"
                },
                "Environment":{
                    ComputeType:"BUILD_GENERAL1_LARGE",
                    EnvironmentVariables:[{
                        Name:"IMAGE_REPO_NAME",
                        Value:{"Ref":"Repo"}
                    },{
                        Name:"IMAGE_TAG",
                        Value:tag,
                    },{
                        Name:"AWS_DEFAULT_REGION",
                        Value:{"Ref":"AWS::Region"}
                    },{
                        Name:"AWS_ACCOUNT_ID",
                        Value:{"Ref":"AWS::AccountId"}
                    }],
                    Image:"aws/codebuild/docker:17.09.0",
                    PrivilegedMode:true,
                    Type:"LINUX_CONTAINER"
                },
                "Name":{"Fn::Sub":"${AWS::StackName}-test-image-build"},
                ServiceRole:{"Ref":"ServiceRole"},
                Source:{
                    Type:"S3",
                    Location:{"Fn::Sub":"${Bucket}/"+source}
                }
            }
        },
        "Bucket": {
          "Type": "AWS::S3::Bucket",
          "Properties": {}
        },
        "Clear":{
            "Type": "Custom::S3Clear",
            "DependsOn":["Bucket"],
            "Properties": {
                "ServiceToken": { "Fn::GetAtt" : ["ClearLambda", "Arn"] },
                "Bucket":{"Ref":"Bucket"}
            }
        },
        "ClearImage":{
            "Type": "Custom::ClearImage",
            "DependsOn":["Bucket"],
            "Properties": {
                "ServiceToken": { "Fn::GetAtt" : ["ClearImageLambda", "Arn"] },
                "repo":{"Ref":"Repo"},
                "tag":tag
            }
        },
        "upload":{
            "Type": "Custom::S3Upload",
            "Properties": {
                "ServiceToken": { "Fn::GetAtt" : ["UploadLambda", "Arn"] },
                "bucket":{"Ref":"Bucket"},
                "key":source,
                "body":buff.toString('base64')
            }
        },
        "Build":{
            "Type": "Custom::CodeBuildStart",
            "DependsOn":["upload"],
            "Properties": {
                "ServiceToken": { "Fn::GetAtt" : ["BuildLambda", "Arn"] },
                "projectName":{"Ref":"ImageBuild"}
            }
        },
        "test":{
            "Type": "Custom::CodeBuildStart",
            "DependsOn":["Build"],
            "Properties": {
                "ServiceToken": { "Fn::GetAtt" : ["BuildLambda", "Arn"] },
                "projectName":{"Ref":"testBuild"},
                "sourceVersion":branch,
                "buildspecOverride":fs.readFileSync(
                    __dirname+'/config/buildspec.yml','utf-8')
            }
        },
        "ClearImageLambda":lambda("clearImage"),
        "BuildLambda": lambda("build"),
        "UploadLambda": lambda("zip"),
        "ClearLambda": lambda("clear"),
        "TestServiceRole": {
          "Type": "AWS::IAM::Role",
          "Properties": {
            "AssumeRolePolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "codebuild.amazonaws.com"
                  },
                  "Action": "sts:AssumeRole"
                }
              ]
            },
            "Path": "/",
            "ManagedPolicyArns": [
              "arn:aws:iam::aws:policy/AdministratorAccess"
            ],
          }
        },
        "ServiceRole": {
          "Type": "AWS::IAM::Role",
          "Properties": {
            "AssumeRolePolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Principal": {
                    "Service": "codebuild.amazonaws.com"
                  },
                  "Action": "sts:AssumeRole"
                }
              ]
            },
            "Path": "/",
            "ManagedPolicyArns": [
              "arn:aws:iam::aws:policy/AmazonECS_FullAccess",
              "arn:aws:iam::aws:policy/AmazonS3FullAccess"
            ],
            "Policies":[{
                "PolicyName":"codebuild",
                "PolicyDocument": {
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Sid": "CloudWatchLogsPolicy",
					  "Effect": "Allow",
					  "Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					  ],
					  "Resource": [
						"*"
					  ]
					},
					{
					  "Sid": "CodeCommitPolicy",
					  "Effect": "Allow",
					  "Action": [
						"codecommit:GitPull",
                        "ecr:*"
					  ],
					  "Resource": [
						"*"
					  ]
					},
					{
					  "Sid": "S3GetObjectPolicy",
					  "Effect": "Allow",
					  "Action": [
						"s3:GetObject",
						"s3:GetObjectVersion"
					  ],
					  "Resource": [
						"*"
					  ]
					},
					{
					  "Sid": "S3PutObjectPolicy",
					  "Effect": "Allow",
					  "Action": [
						"s3:PutObject"
					  ],
					  "Resource": [
						"*"
					  ]
					}
				  ]
                }
			}]
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
              "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
              "arn:aws:iam::aws:policy/AmazonECS_FullAccess",
              "arn:aws:iam::aws:policy/AmazonS3FullAccess",
              "arn:aws:iam::aws:policy/AWSCodeBuildAdminAccess"
            ],
            "Policies":[{
                "PolicyName":"codebuild",
                "PolicyDocument": {
				  "Version": "2012-10-17",
				  "Statement": [
					{
					  "Effect": "Allow",
					  "Action": [
						"lambda:InvokeFunction",
                        "ecr:*"
					  ],
					  "Resource": [
						"*"
					  ]
					}
				  ]
                }
			}]
          }
        }
      },
       "Outputs": {
            "BuildConsole":{
                "Value":{"Fn::Sub":"https://console.aws.amazon.com/codebuild/home?region=${AWS::Region}#/projects/${testBuild}/view"}
            },
            "ImageConsole":{
                "Value":{"Fn::Sub":"https://console.aws.amazon.com/codebuild/home?region=${AWS::Region}#/projects/${ImageBuild}/view"}
            }
       }
    }
}
run()
module.exports=run()


function lambda(name){
    return {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
            "ZipFile":fs.readFileSync(__dirname+`/lambda/${name}.js`,'utf-8')
        },
        "Handler": "index."+name,
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["LambdaRole","Arn"]},
        "Runtime": "nodejs8.10",
        "Timeout": 300
      }
    }
}
