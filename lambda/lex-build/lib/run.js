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

const aws=require('./aws')
const lex=new aws.LexModelBuildingService()

module.exports=async function run(fnc,params){
    console.log(fnc+':request:'+JSON.stringify(params,null,3))
    const next=async function(count){
        console.log('tries-left:'+count)
        try {
            const response= await lex[fnc](params).promise()
            console.log(fnc+':result:'+JSON.stringify(response,null,3))
            return response
        } catch (err) {
            console.log(fnc+':'+err.code)
            const retry = err.retryDelay || 5
            console.log('retry in '+retry)

            if(err.code==='ConflictException'){
                if(count===0) throw new Error('Error');
                await retryPromise(retry*1000)
                return next(--count);
            }else if(err.code==='ResourceInUseException'){
                if(count===0) throw new Error('Error');
                await retryPromise(retry*1000)
                return next(--count);
            }else if(err.code==='LimitExceededException'){
                await retryPromise(retry*1000)
                return next(count);
            }else{
                throw new Error(err.code+':'+err.message)
            }  
        }
    }
    return await next(200)
}

function retryPromise(ms) {
    return new Promise(res => setTimeout(res, ms))
}