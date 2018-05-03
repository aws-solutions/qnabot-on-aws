module.exports={
    "FeedbackFirehose": {
        "Type" : "AWS::KinesisFirehose::DeliveryStream",
        "Properties" : {
            "DeliveryStreamType" : "DirectPut",
            "ElasticsearchDestinationConfiguration" : {
                "BufferingHints" : {
                    "IntervalInSeconds" : 60,
                    "SizeInMBs" : 5
                },
                "CloudWatchLoggingOptions" : {
                    "Enabled" : true,
                    "LogGroupName" : "/aws/kinesisfirehose/qna-feedback-feedback-metrics",
                    "LogStreamName" : "ElasticsearchDelivery"
                },
                "DomainARN" :{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"] },
                "IndexName" : "feedback-metrics",
                "IndexRotationPeriod" : "NoRotation",
                "RetryOptions" : {
                    "DurationInSeconds" : 300
                },
                "RoleARN" : {"Fn::GetAtt" : ["FeedbackFirehoseESS3Role", "Arn"] },
                "S3BackupMode" : "AllDocuments",
                "S3Configuration" : 
                {
                    "BucketARN" : { "Fn::GetAtt" : [ "QNAFeedbackBucket", "Arn" ] },
                    "BufferingHints" : {
                        "IntervalInSeconds" : 60,
                        "SizeInMBs" : 5
                    },
                    "CloudWatchLoggingOptions" : {
                        "Enabled" : true,
                        "LogGroupName" : "/aws/kinesisfirehose/qna-feedback-feedback-metrics",
                        "LogStreamName" : "S3Delivery"
                    },
                    "CompressionFormat" : "UNCOMPRESSED",
                    "RoleARN" : {"Fn::GetAtt" : ["FeedbackFirehoseESS3Role", "Arn"] }
                },
                "TypeName" : "feedback"
            },
        }
    },
    "QNAFeedbackBucket":{
        "Type" : "AWS::S3::Bucket",
        "DeletionPolicy":"Delete",
        "Properties" : {
          "Tags" : [
              {
                "Key" : "Use",
                "Value" : "feedback-metrics"
              }
            ]
        }
    },
    "ClearFeedbackBucket":{
        "Type": "Custom::S3Clear",
        "DependsOn":["CFNInvokePolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Bucket":{"Ref":"QNAFeedbackBucket"}
        }
    },
    "FeedbackFirehoseESS3Role":{
        "Type": "AWS::IAM::Role",
        "Properties": {
          "AssumeRolePolicyDocument": {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                    "Service": "firehose.amazonaws.com"
                },
                "Action": "sts:AssumeRole"
                }   
            ]
          },
          "Path": "/",
          "Policies": [ {
          "PolicyDocument" : {
            "Version": "2012-10-17",
            "Statement": [
              {
                "Sid": "",
                "Effect": "Allow",
                "Action": [
                  "s3:AbortMultipartUpload",
                  "s3:GetBucketLocation",
                  "s3:GetObject",
                  "s3:ListBucket",
                  "s3:ListBucketMultipartUploads",
                  "s3:PutObject"
                ],
                "Resource": [
                  {"Fn::GetAtt": ["QNAFeedbackBucket", "Arn"]},
                  {"Fn::Join":["",[{"Fn::GetAtt": ["QNAFeedbackBucket", "Arn"]},"/*"]]}
                ]
              },
              {
                "Sid": "",
                "Effect": "Allow",
                "Action": [
                  "lambda:InvokeFunction",
                  "lambda:GetFunctionConfiguration"
                ],
                "Resource":[
                  {"Fn::Join": ["",["arn:aws:lambda:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":function:%FIREHOSE_DEFAULT_FUNCTION%:%FIREHOSE_DEFAULT_VERSION%"]]}
                ]
              },
              {
                "Sid": "",
                "Effect": "Allow",
                "Action": [
                  "es:DescribeElasticsearchDomain",
                  "es:DescribeElasticsearchDomains",
                  "es:DescribeElasticsearchDomainConfig",
                  "es:ESHttpPost",
                  "es:ESHttpPut"
                ],
                "Resource": [
                  {"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/*"]]}
                ]
              },
              {
                "Sid": "",
                "Effect": "Allow",
                "Action": [
                  "es:ESHttpGet"
                ],
                "Resource": [
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/_all/_settings"]]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/_cluster/stats"]]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/feedback-metrics*/_mapping/feedback"]]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/_nodes"]]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/_nodes/stats"]]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/_nodes/*/stats"]]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/_stats"]]},
                  {"Fn::Join":["",[{"Fn::GetAtt" : ["ElasticsearchDomain", "DomainArn"]},"/feedback-metrics*/_stats"]]}
                ]
              },
              {
                "Sid": "",
                "Effect": "Allow",
                "Action": [
                  "logs:PutLogEvents"
                ],
                "Resource": [
                  {"Fn::Join": ["",["arn:aws:logs:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":log-group:/aws/kinesisfirehose/test:log-stream:*"]]}
                ]
              },
              {
                "Sid": "",
                "Effect": "Allow",
                "Action": [
                  "kinesis:DescribeStream",
                  "kinesis:GetShardIterator",
                  "kinesis:GetRecords"
                ],
                "Resource": [
                  {"Fn::Join": ["",["arn:aws:kinesis:",{ "Ref" : "AWS::Region" },":",{ "Ref" : "AWS::AccountId" },":stream/%FIREHOSE_STREAM_NAME%"]]}
                ]
              },
              {
                "Effect": "Allow",
                "Action": [
                  "kms:Decrypt"
                ],
                "Resource": [
                  "arn:aws:kms:region:accountid:key/%SSE_KEY_ARN%"
                ],
                "Condition": {
                  "StringEquals": {
                    "kms:ViaService": "kinesis.%REGION_NAME%.amazonaws.com"
                  },
                  "StringLike": {
                    "kms:EncryptionContext:aws:kinesis:arn": "arn:aws:kinesis:%REGION_NAME%:507296099304:stream/%FIREHOSE_STREAM_NAME%"
                  }
                }
              }
            ]
          },
          "PolicyName" : "PutQnAFeedbackFirehose"
      }]
        }
    }
}
