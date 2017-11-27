module.exports={
   "Description": "This template creates dev ElasticSearch Cluster",
   "Resources": {
      "Domain": {
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
   },
   "Outputs": {
        "Address":{
            "Value":{"Fn::GetAtt":["Domain","DomainEndpoint"]},
            "Export":{
                "Name":"QNA-DEV-ES-ADDRESS"
            }
        },
        "Arn":{
            "Value":{"Fn::GetAtt":["Domain","DomainArn"]},
            "Export":{
                "Name":"QNA-DEV-ES-ARN"
            }
        },
        "Name":{
            "Value":{"Ref":"Domain"},
            "Export":{
                "Name":"QNA-DEV-ES-NAME"
            }
        }
   }
}
