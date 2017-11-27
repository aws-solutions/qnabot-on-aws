module.exports={
    "Variable":{
        "Type" : "AWS::Lambda::Function",
        "Properties" : {
            "Code" :{
                "S3Bucket": {"Ref":"BootstrapBucket"},
                "S3Key":{"Fn::Join":["",[
                    {"Ref":"BootstrapPrefix"},
                    "/lambda/cfn.zip"
                ]]}
            },
            "Handler" : "index.handler",
            "MemorySize" : "128",
            "Role" : {"Fn::GetAtt":["VariableRole","Arn"]},
            "Runtime" : "nodejs6.10",
            "Timeout" : 10
        }
    },
    "VariableRole" : {
        "Type"  : "AWS::IAM::Role",
        "Properties" : {
            "AssumeRolePolicyDocument" : {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]       
            },
            "Path" : "/",
            "ManagedPolicyArns":[
                "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
            ]
        }
    }
}
