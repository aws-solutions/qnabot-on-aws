var fs=require('fs');
var _=require('lodash');
const util = require('../util');

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|dashboard|index|test|.DS_Store/))
    .map(x=>require(`./${x}`))

var lambdas=[]
_.forEach(_.assign.apply({},files),(value,key)=>{
    if(value.Type==='AWS::Lambda::Function'){
        var type=_.fromPairs(value.Properties.Tags.map(x=>[x.Key,x.Value])).Type
        if(type==="Api" || type=="Service"){
            lambdas.push([
                `InvokePermission${key}`,
                permission(key)
            ])
        }
    }
})

module.exports=Object.assign(
    _.fromPairs(lambdas),
{"LambdaAccessRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "apigateway.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Path": "/",
        "Policies": [
          util.basicLambdaExecutionPolicy(),
          util.lambdaVPCAccessExecutionRole(),
          util.xrayDaemonWriteAccess(),
          {
            "PolicyName" : "LambdaPolicy",
            "PolicyDocument" : {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:*"
                  ],
                  "Resource":["*"]
                }
              ]
            }
          }
        ]
      },
      "Metadata": util.cfnNag(["W11", "W12", "F3"])
  },
})

function permission(name){
    return {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "Action": "lambda:InvokeFunction",
        "FunctionName":{"Fn::GetAtt":[name,"Arn"]},
        "Principal": "apigateway.amazonaws.com"
      }
    }
}
