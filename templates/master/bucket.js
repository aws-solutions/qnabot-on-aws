const util = require('../util');
module.exports = {
  "ExportBucket": {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "LifecycleConfiguration": {
        "Rules": [{
          "NoncurrentVersionExpirationInDays": 1,
          "Status": "Enabled"
        }, {
          "AbortIncompleteMultipartUpload": {
            "DaysAfterInitiation": 1
          },
          "Status": "Enabled"
        }]
      },
      "VersioningConfiguration": {
        "Status": "Enabled"
      },
      "CorsConfiguration": {
        "CorsRules": [{
          "AllowedHeaders": ['*'],
          "AllowedMethods": ['GET'],
          "AllowedOrigins": ['*']
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
      },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": true,
        "BlockPublicPolicy": true,
        "IgnorePublicAcls": true,
        "RestrictPublicBuckets": true
      }
    },
    "UpdateReplacePolicy": "Retain",
    "DeletionPolicy": "Retain",
    "Metadata": util.cfnNag(["W35"])
  },
  "HTTPSOnlyExportBucketPolicy": {
    "Type": "AWS::S3::BucketPolicy",
    "Properties": {
      "Bucket": {
        "Ref": "ExportBucket"
      },
      "PolicyDocument": {
        "Statement": [
          {
            "Action": "*",
            "Condition": {
              "Bool": {
                "aws:SecureTransport": "false"
              }
            },
            "Effect": "Deny",
            "Principal": "*",
            "Resource": {
              "Fn::Join": [
                "",
                [
                  {
                    "Fn::GetAtt": [
                      "ExportBucket",
                      "Arn"
                    ]
                  },
                  "/*"
                ]
              ]
            },
            "Sid": "HttpsOnly"
          }
        ],
        "Version": "2012-10-17"
      }
    },
  },
  "ImportBucket": {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "LifecycleConfiguration": {
        "Rules": [{
          "ExpirationInDays": 1,
          "Status": "Enabled"
        }]
      },
      "VersioningConfiguration": {
        "Status": "Enabled"
      },
      "CorsConfiguration": {
        "CorsRules": [{
          "AllowedHeaders": ['*'],
          "AllowedMethods": ['PUT'],
          "AllowedOrigins": ['*']
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
      },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": true,
        "BlockPublicPolicy": true,
        "IgnorePublicAcls": true,
        "RestrictPublicBuckets": true
      }
    },
    "Metadata": util.cfnNag(["W35"])
  },
  "HTTPSOnlyImportBucketPolicy": {
    "Type": "AWS::S3::BucketPolicy",
    "Properties": {
      "Bucket": {
        "Ref": "ImportBucket"
      },
      "PolicyDocument": {
        "Statement": [
          {
            "Action": "*",
            "Condition": {
              "Bool": {
                "aws:SecureTransport": "false"
              }
            },
            "Effect": "Deny",
            "Principal": "*",
            "Resource": {
              "Fn::Join": [
                "",
                [
                  {
                    "Fn::GetAtt": [
                      "ImportBucket",
                      "Arn"
                    ]
                  },
                  "/*"
                ]
              ]
            },
            "Sid": "HttpsOnly"
          }
        ],
        "Version": "2012-10-17"
      }
    },
  },
  "TestAllBucket": {
    "Type": "AWS::S3::Bucket",
    "Properties": {
      "LifecycleConfiguration": {
        "Rules": [{
          "ExpirationInDays": 1,
          "Status": "Enabled"
        }]
      },
      "VersioningConfiguration": {
        "Status": "Enabled"
      },
      "CorsConfiguration": {
        "CorsRules": [{
          "AllowedHeaders": ['*'],
          "AllowedMethods": ['GET'],
          "AllowedOrigins": ['*']
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
      },
      "PublicAccessBlockConfiguration": {
        "BlockPublicAcls": true,
        "BlockPublicPolicy": true,
        "IgnorePublicAcls": true,
        "RestrictPublicBuckets": true
      }
    },
    "Metadata": util.cfnNag(["W35"])
  },
  "HTTPSOnlyTestAllBucketPolicy": {
    "Type": "AWS::S3::BucketPolicy",
    "Properties": {
      "Bucket": {
        "Ref": "TestAllBucket"
      },
      "PolicyDocument": {
        "Statement": [
          {
            "Action": "*",
            "Condition": {
              "Bool": {
                "aws:SecureTransport": "false"
              }
            },
            "Effect": "Deny",
            "Principal": "*",
            "Resource": {
              "Fn::Join": [
                "",
                [
                  {
                    "Fn::GetAtt": [
                      "TestAllBucket",
                      "Arn"
                    ]
                  },
                  "/*"
                ]
              ]
            },
            "Sid": "HttpsOnly"
          }
        ],
        "Version": "2012-10-17"
      }
    },
  }
};
