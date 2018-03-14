module.exports={
    "MetricFirehose": {
        "Type" : "AWS::KinesisFirehose::DeliveryStream",
        "Properties" : {
            "DeliveryStreamName" : "qna-Metrics",
            "DeliveryStreamType" : "DirectPut",
            "ElasticsearchDestinationConfiguration" : {
                "BufferingHints" : {
                    "IntervalInSeconds" : 60,
                    "SizeInMBs" : 5
                },
                "CloudWatchLoggingOptions" : {
                    "Enabled" : true,
                    "LogGroupName" : "/aws/kinesisfirehose/qna-feedback-metrics",
                    "LogStreamName" : "ElasticsearchDelivery"
                },
                "DomainARN" : {"Ref":"ElasticsearchDomain"},
                "IndexName" : "metrics",
                "IndexRotationPeriod" : "NoRotation",
                "RetryOptions" : {
                    "DurationInSeconds" : 300
                },
                "RoleARN" : {"Fn::GetAtt" : ["FirehoseESS3Role", "Arn"] },
                "S3BackupMode" : "AllDocuments",
                "S3Configuration" : 
                {
                    "BucketARN" : { "Fn::GetAtt" : [ "MetricsBucket", "Arn" ] },
                    "BufferingHints" : {
                        "IntervalInSeconds" : 60,
                        "SizeInMBs" : 5
                    },
                    "CloudWatchLoggingOptions" : {
                        "Enabled" : true,
                        "LogGroupName" : "/aws/kinesisfirehose/qna-feedback-metrics",
                        "LogStreamName" : "S3Delivery"
                    },
                    "CompressionFormat" : "UNCOMPRESSED",
                    "RoleARN" : {"Fn::GetAtt" : ["FirehoseESS3Role", "Arn"] }
                },
                "TypeName" : "feedback"
            },
        }
    },
    "MetricsBucket":{
        "Type" : "AWS::S3::Bucket",
        "DeletionPolicy":"Delete",
        "Properties" : {
          "Tags" : [
              {
                "Key" : "Use",
                "Value" : "Metrics"
              }
            ]
        }
    },
    "FirehoseESS3Role":{
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
          "ManagedPolicyArns": [
            "arn:aws:iam::aws:policy/AmazonS3FullAccess",
            "arn:aws:iam::aws:policy/AmazonESFullAccess"
          ]
        }
    }
}
