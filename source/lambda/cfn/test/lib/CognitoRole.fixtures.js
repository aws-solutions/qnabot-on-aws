/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

exports.cognitoIdpParamsObject = function () {
    const response = {
        RoleMappings: [{
            'UserPool': 'user_pool_1',
            'ClientId': '1'
        }, 
        {
            'UserPool': 'user_pool_2',
            'ClientId': '2'
        }]
    }

    return response;
}

exports.getIdentityPoolRolesCommandObject = function() {
    const response = {
        IdentityPoolId: 'mock_identity_pool_id',
        Roles: {
            'mock_role_1': 'val1',
            'mock_role_2': 'val2'
        },
        RoleMappings: {
            'cognito-idp.us-east-1.amazonaws.com/user_pool_1:1': {
                "AmbiguousRoleResolution": "mock_ambiguous_role1",
                "RulesConfiguration": { 
                    "Rules": [ 
                        { 
                            "Claim": "mock_claim_1",
                            "MatchType": "mock_match_type1",
                            "RoleARN": "mock_role_arn1",
                            "Value": "mock_value1"
                        }
                    ]
                },
                "Type": "string"
            },
            'cognito-idp.us-east-1.amazonaws.com/user_pool_2:2': {
                "AmbiguousRoleResolution": "mock_ambiguous_role2",
                "RulesConfiguration": { 
                    "Rules": [ 
                        { 
                            "Claim": "mock_claim_2",
                            "MatchType": "mock_match_type2",
                            "RoleARN": "mock_role_arn2",
                            "Value": "mock_value2"
                        }
                    ]
                },
                "Type": "string"
            }
        }
    }

    return response;
}