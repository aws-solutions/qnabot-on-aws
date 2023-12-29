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
const { LexModelBuildingService } = require('@aws-sdk/client-lex-model-building-service');
const customSdkConfig = require('sdk-config/customSdkConfig');
const lex = new LexModelBuildingService(customSdkConfig('C001', { region }));

module.exports = async function run(fnc, params){
    console.log(fnc + ':request:' + JSON.stringify(params, null, 3));
    const next = async function(count){
        console.log('tries-left:' + count);
        try {
            const response = await lex[fnc](params);
            console.log(fnc + ':result:'+ JSON.stringify(response, null, 3));
            return response
        } catch (err) {
            console.log(fnc + ':' + err?.name);
            const retry = err?.retryAfterSeconds || 5;
            console.log('retry in ' + retry);

            if(err?.name === 'ConflictException'){
                if(count === 0) throw new Error('Error');
                await retryPromise(retry*1000);
                await next(--count);
            }else if(err?.name === 'ResourceInUseException'){
                if(count === 0) throw new Error('Error');
                await retryPromise(retry*1000);
                await next(--count);
            }else if(err?.name === 'LimitExceededException'){  // NOSONAR easier for code understanding
                await retryPromise(retry*1000);
                await next(count);
            }else{
                throw new Error(err?.name + ':' + err?.message);
            }
        }
    }
    return await next(200);
}

async function retryPromise(ms) {
    return new Promise(res => setTimeout(res, ms));
}
