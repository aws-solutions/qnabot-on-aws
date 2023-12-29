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

const region = process.env.AWS_REGION || 'us-east-1';
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const customSdkConfig = require('sdk-config/customSdkConfig');
const lambda = new LambdaClient(customSdkConfig('C001', { region }));

module.exports = async function(status){
    console.log('calling poll lambda')
    try {
        const params = {
            FunctionName:process.env.POLL_LAMBDA,
            InvocationType:'Event',
            Payload:'{}'
        }
        const invokeCmd = new InvokeCommand(params)
        const response = await lambda.send(invokeCmd)
        return response
 
    } catch (error) {
        console.error("An error invoking lambda in wait: ", error);
        throw error;
    }
}