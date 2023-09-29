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

module.exports = {
    stageVariables: {
        Region: 'us-east-1',
        PoolId: 'Pool-2121',
        ClientId: 'Client-adad',
        UserPool: 'User-adada',
        CognitoEndpoint: 'www.example.com',
        ESQidLambda: 'lambda',
        ApiUrl: 'url',
        BotName: 'bot',
        SlotType: 'slot',
        Intent: 'intent',
        LambdaArn: 'ar',
        ESEndpoint: 'test',
        ESIndex: 'index',
        ESType: 'type',
        ImportBucket: 'import',
        Id: 'id',
    },
    util: {
        parseJson: JSON.parse,
        urlDecode: (x) => x,
    },
    context: {
        apiId: 'id',
        stage: 'prod',
    },
};
