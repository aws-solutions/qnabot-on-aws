module.exports={
   "Description": "This template creates dev ElasticSearch Cluster",
   "Resources": {
    "Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
				"Effect": "Allow",
				"Principal": {
					"Federated": "cognito-identity.amazonaws.com"
				},
				"Action": "sts:AssumeRoleWithWebIdentity",
				"Condition": {
				    "StringEquals": {
				        "cognito-identity.amazonaws.com:aud":{"Ref":"IdPool"}
				    }
				}
            }
          ]
        },
        "Path": "/",
        "ManagedPolicyArns": []
      }
    },
    "IdPool": {
      "Type": "AWS::Cognito::IdentityPool",
      "Properties": {
        "IdentityPoolName": "UserPool",
        "AllowUnauthenticatedIdentities": true,
        "CognitoIdentityProviders": [
          {
            "ClientId": {
              "Ref": "Client"
            },
            "ProviderName": {
              "Fn::GetAtt": [
                "UserPool",
                "ProviderName"
              ]
            },
            "ServerSideTokenCheck": true
          }
        ]
      }
    },
    "UserPool": {
      "Type": "AWS::Cognito::UserPool",
      "Properties": {
        "UserPoolName": {
          "Fn::Join": ["-",["UserPool",{"Ref": "AWS::StackName"}]]}
      }
    },
    "Client": {
      "Type": "AWS::Cognito::UserPoolClient",
      "Properties": {
        "ClientName": {
          "Fn::Join": ["-",["UserPool",{"Ref": "AWS::StackName"}]]},
        "GenerateSecret": false,
        "UserPoolId": {"Ref": "UserPool"}
      }
    }
   },
   "Outputs": {
        "IdPool":{
            "Value":{"Ref":"IdPool"},
            "Export":{
                "Name":"QNA-DEV-IDPOOL"
            }
        },
        "UserPool":{
            "Value":{"Ref":"UserPool"},
            "Export":{
                "Name":"QNA-DEV-USERPOOL"
            }
        },
        "Client":{
            "Value":{"Ref":"Client"},
            "Export":{"Name":"QNA-DEV-CLIENT"}
        },
        "Role":{
            "Value":{"Fn::GetAtt":["Role","Arn"]},
            "Export":{"Name":"QNA-DEV-ROLE-ARN"}
        }
   }
}
