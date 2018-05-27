module.exports={
    "Bucket":{
        "Type" : "AWS::S3::Bucket",
        "DeletionPolicy":"Delete",
        "Properties" : {
            "WebsiteConfiguration":{
                "IndexDocument":"index.html"
            }
        }
    },
    "Clear":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNInvokePolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"Bucket"}
        }
    },
    "Unzip":{
        "Type": "Custom::S3Unzip",
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "SrcBucket":{"Ref":"BootstrapBucket"},
            "Key":{"Fn::Join":["",[
                {"Ref":"BootstrapPrefix"},
                "/website.zip"
            ]]},
            "DstBucket":{"Ref":"Bucket"},
            "buildDate":new Date()
        },
        "DependsOn":"Clear"
    },
    "S3AccessRole": {
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
        "ManagedPolicyArns": [{"Ref":"S3AccessPolicy"}]
      }
    },
    "S3AccessPolicy":{
      "Type": "AWS::IAM::ManagedPolicy",
      "Properties": {
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [{
              "Effect": "Allow",
              "Action": [
                "lex:*"
              ],
              "Resource":"*" 
            },{
              "Effect": "Allow",
              "Action": [
                "s3:GetObject"
              ],
              "Resource": [
                {"Fn::Sub":"arn:aws:s3:::${ImportBucket}/*"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}/*"},
                {"Fn::Sub":"arn:aws:s3:::${Bucket}/*"},
                {"Fn::Sub":"arn:aws:s3:::${AssetBucket}/*"}
              ]
            },{
              "Effect": "Allow",
              "Action": [
                "s3:PutObject"
              ],
              "Resource": [
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}/*"},
              ]
            },{
              "Effect": "Allow",
              "Action": [
                "s3:DeleteObject"
              ],
              "Resource": [
                {"Fn::Sub":"arn:aws:s3:::${ImportBucket}/*"},
                {"Fn::Sub":"arn:aws:s3:::${ExportBucket}/*"}
              ]
            }]
        }
      }
    }
}
