/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */

module.exports = {
    StreamingWebSocketApiId: {
        Value: { Ref: 'WebSocketAPI' }
    },
    StreamingWebSocketEndpoint: {
        Value: { 
            'Fn::Sub': 'wss://${WebSocketAPI}.execute-api.${AWS::Region}.amazonaws.com/Prod'
        }
    },
    StreamingLambdaArn: {
        Value: { 'Fn::GetAtt': ['StreamingLambda', 'Arn'] }
    },
    StreamingDynamoDbTable: {
        Value: { Ref: 'StreamingDynamoTable' }
    },
    StreamingDynamoDbTableArn: {
        Value: { 'Fn::GetAtt': ['StreamingDynamoTable', 'Arn'] }
    }
};