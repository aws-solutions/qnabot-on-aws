var outputs=require('../../bin/exports')

module.exports=outputs('dev/bootstrap')
.then(function(output){
    return {
   "Description": "This template creates dev ElasticSearch Cluster",
   "Resources": {
    "Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VersioningConfiguration":{
            "Status":"Enabled"
        }
      }
    },
    "Clear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNLambdaPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"Bucket"}
        }
    },
    "CFNLambda":{
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "Code": {
          "S3Bucket":output.Bucket ,
          "S3Key": {"Fn::Join":["",[
            output.Prefix,
            "/lambda/cfn.zip"
          ]]}
        },
        "Handler": "index.handler",
        "MemorySize": "128",
        "Role": {"Fn::GetAtt": ["CFNLambdaRole","Arn"]},
        "Runtime": "nodejs6.10",
        "Timeout": 60
      }
    },
    "CFNLambdaRole":{
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
            {"Ref":"CFNLambdaPolicy"}
        ]
      }
    },
    "CFNLambdaPolicy":{
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:*"
              ],
              "Resource":[
                {"Fn::Sub":"arn:aws:s3:::${Bucket}*"},
              ]
            }
          ]
        }
      }
    }
   },
   "Outputs": {
        "Bucket": {
            "Value": {"Ref": "Bucket"}
        }
   }
}
})
