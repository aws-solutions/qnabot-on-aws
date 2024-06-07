/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/

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