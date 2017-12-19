module.exports={
    "EsInit":{
        "Type": "Custom::EsInit",
        "DependsOn":["ReadPolicy"],
        "Properties": {
            "ServiceToken": { "Fn::GetAtt" : ["CFNLambda", "Arn"] },
            "Address":{"Fn::GetAtt":["ElasticsearchDomain","DomainEndpoint"]},
            "Index":"qna-index",
            "Name":"qna",
            "Type":JSON.stringify(require('./schema'))
        }
    },
    "ElasticsearchDomain": {
         "Type": "AWS::Elasticsearch::Domain",
         "Properties": {
            "AccessPolicies": {
               "Version": "2012-10-17",
               "Statement": [
                  {
                     "Sid": "EnforceAuth",
                     "Principal": {
                        "AWS": {"Ref":"AWS::AccountId"}
                     },
                     "Effect": "Allow",
                     "Action": "es:*",
                     "Resource": "*"
                  }
               ]
            },
            "ElasticsearchClusterConfig": {
               "DedicatedMasterEnabled": false,
               "InstanceCount": 1,
               "InstanceType": "t2.small.elasticsearch",
               "ZoneAwarenessEnabled": "false"
            },
            "EBSOptions": {
               "EBSEnabled": true,
               "VolumeSize": 10,
               "VolumeType": "gp2"
            },
            "ElasticsearchVersion": "5.1",
            "SnapshotOptions": {
               "AutomatedSnapshotStartHour": "0"
            },
            "AdvancedOptions": {
               "rest.action.multi.allow_explicit_index": "true"
            }
         }
      }
}
