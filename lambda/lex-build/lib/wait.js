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

const aws = require('./aws');

const lambda = new aws.Lambda();

module.exports=async function(status){
    console.log('calling poll lambda')
    try {
        const response = await lambda.invoke({
            FunctionName:process.env.POLL_LAMBDA,
            InvocationType:'Event',
            Payload:'{}'
        }).promise()
        return response
 
    } catch (error) {
        console.error("An error invoking lambda in wait: ", error);
        throw error;
    }
}