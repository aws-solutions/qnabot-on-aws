module.exports={
    "ExportBucket":{
        "Type" : "AWS::S3::Bucket",
        "Properties":{
            LifecycleConfiguration:{
                Rules:[{
                    NoncurrentVersionExpirationInDays:1,
                    Status:"Enabled"
                },{
                    AbortIncompleteMultipartUpload:{
                        DaysAfterInitiation:1
                    },
                    Status:"Enabled"
                }]
            },
            "VersioningConfiguration":{
                "Status":"Enabled"
            },
            "CorsConfiguration":{
                CorsRules:[{
                    AllowedHeaders:['*'],
                    AllowedMethods:['GET'],
                    AllowedOrigins:['*']
                }]
            },
            "BucketEncryption": {
                "Fn::If": [
                    "Encrypted",
                    {
                        "ServerSideEncryptionConfiguration": [{
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }]
                    },
                    {
                        "Ref": "AWS::NoValue"
                    }
                ]
            }
        }
    },
    "ImportBucket":{
        "Type" : "AWS::S3::Bucket",
        "Properties":{
            LifecycleConfiguration:{
                Rules:[{
                    ExpirationInDays:1,
                    Status:"Enabled"
                }]
            },
            "VersioningConfiguration":{
                "Status":"Enabled"
            },
            "CorsConfiguration":{
                CorsRules:[{
                    AllowedHeaders:['*'],
                    AllowedMethods:['PUT'],
                    AllowedOrigins:['*']
                }]
            },
            "BucketEncryption": {
                "Fn::If": [
                    "Encrypted",
                    {
                        "ServerSideEncryptionConfiguration": [{
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }]
                    },
                    {
                        "Ref": "AWS::NoValue"
                    }
                ]
            }
        }
    },
    "TestAllBucket":{
        "Type" : "AWS::S3::Bucket",
        "Properties":{
            LifecycleConfiguration:{
                Rules:[{
                    ExpirationInDays:1,
                    Status:"Enabled"
                }]
            },
            "VersioningConfiguration":{
                "Status":"Enabled"
            },
            "CorsConfiguration":{
                CorsRules:[{
                    AllowedHeaders:['*'],
                    AllowedMethods:['GET'],
                    AllowedOrigins:['*']
                }]
            },
            "BucketEncryption": {
                "Fn::If": [
                    "Encrypted",
                    {
                        "ServerSideEncryptionConfiguration": [{
                            "ServerSideEncryptionByDefault": {
                                "SSEAlgorithm": "AES256"
                            }
                        }]
                    },
                    {
                        "Ref": "AWS::NoValue"
                    }
                ]
            }
        }
    }
}
