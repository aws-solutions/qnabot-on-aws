var fs=require('fs')
var _=require('lodash')

var files=fs.readdirSync(`${__dirname}`)
    .filter(x=>!x.match(/README.md|Makefile|dashboard|index|test/))
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          {"Ref":"LambdaPolicy"}
        ]
      }
},
"LambdaPolicy": {
  "Type": "AWS::IAM::ManagedPolicy",
  "Properties": {
    "PolicyDocument": {
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
}
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
