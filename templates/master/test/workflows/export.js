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

const config=require('../../../../config.json')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
const _=require('lodash')
const api=require('../util').api
const faker=require('faker').lorem
const range=require('range').range
const aws=require('aws-sdk')
aws.config.region=config.region
const s3=new aws.S3()

module.exports={
    setUp:function(done){
        const count=10000
        const name=(new Date()).getTime()
        this.name=name
        this.count=count
        api({
            path:"jobs",
            method:"GET"
        })
        .then(x=>x._links.imports)
        .then(info=>s3.putObject({
            Bucket:info.bucket,
            Key:info.uploadPrefix+name,
            Body:range(0,count).map(qna).join('\n')
        }).promise())
        .then(function(info){
            return new Promise(function(res,rej){
                function next(i){
                    console.log("tries left:"+i)
                    if(i>0){
                        api({
                            path:"jobs/imports",
                            method:"GET"
                        })
                        .then(x=>x.jobs.map(y=>y.id).includes(name) ?
                            setTimeout(()=>next(--i),2000) : res(x) )
                        .catch(x=>x.statusCode===404,
                            ()=>setTimeout(()=>next(--i),2000))
                        .catch(rej)
                    }else{
                        rej("timeout")
                    }
                }
                next(100)
            })
        })
        .then(function(info){
            return new Promise(function(res,rej){
                function next(i){
                    console.log("tries left:"+i)
                    if(i>0){
                        api({
                            path:"jobs/imports/" + name,
                            method:"GET"
                        }).catch(e => {
                            console.log(e);
                            throw e;
                        })
                        .then(x => x.status === "InProgress" ?
                            setTimeout(() => next(--i), 2000) : res(x) )
                        .catch(x => x.response.status === 404,
                            () => setTimeout(() => next(--i), 2000))
                        .catch(rej)
                    }else{
                        rej("timeout")
                    }
                }
                next(100)
            })
        })
        .finally(done)
    },
    all:async function(test){
        const info=await api({
            path:"jobs",
            method:"GET"
        })

        const start=await api({
            href:`${info._links.exports.href}/test-all`,
            method:"PUT",
            body:{}
        })
        try{
            const completed=await new Promise(async function(res,rej){
                next(100)
                async function next(count){
                    const status=await api({
                        href:`${info._links.exports.href}/test-all`,
                        method:"GET",
                    })
                    if(status.status==="Completed"){
                        res(status)
                    }else if(status.status==="Error"){
                        rej(status)
                    }else{
                        count>0 ? setTimeout(()=>next(--count),1000) : rej("timeout")
                    }
                }
            })
            const data=(await s3.getObject({
                Bucket:completed.bucket,
                Key:completed.key,
            }).promise()).Body.toString().split('\n')
            console.log(data.length,this.count)
            test.ok(data.length>=this.count)
            data.forEach(x=>{
                try{
                    JSON.parse(x)
                }catch(e){
                    test.ifError(e)
                    console.log(x)
                }
            })
        }catch(e){
            console.log(e)
            test.ifError(e)
        }
        await api({
            href:`${info._links.exports.href}/test-all`,
            method:"DELETE",
        })
        test.done()
    },
    filter:async function(test){
        const info=await api({
            path:"jobs",
            method:"GET"
        })
        const start=await api({
            href:`${info._links.exports.href}/test-filter`,
            method:"PUT",
            body:{
                filter:"none.*"
            }
        })
        try{
            const completed=await new Promise(async function(res,rej){
                next(100)
                async function next(count){
                    const status=await api({
                        href:`${info._links.exports.href}/test-filter`,
                        method:"GET",
                    })
                    if(status.status==="Completed"){
                        res(status)
                    }else if(status.status==="Error"){
                        rej(status)
                    }else{
                        count>0 ? setTimeout(()=>next(--count),1000) : rej("timeout")
                    }
                }
            })
            const data=(await s3.getObject({
                Bucket:completed.bucket,
                Key:completed.key,
            }).promise()).Body.toString().split('\n')
            test.equal(data.length,1)
        }catch(e){
            console.log(e)
            test.ifError(e)
        }
        await api({
            href:`${info._links.exports.href}/test-filter`,
            method:"DELETE",
        })
        test.done()
    },
    tearDown:async function(done){
        await api({
            path:"jobs/imports/"+this.name,
            method:"DELETE"
        })
        await api({
            path:"questions",
            method:"DELETE",
            body:{
                query:"bulk-test.*"
            }
        })
        done()
    }
}

function qna(index){
    return JSON.stringify({
        qid:"bulk-test."+index,
        q:range(0,1).map(x=>faker.sentence()),
        a:faker.sentence()
    })
}
