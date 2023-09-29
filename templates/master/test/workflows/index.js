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
const query=require('query-string').stringify
const _=require('lodash')
const zlib=require('zlib')
const Url=require('url')
const sign=require('aws4').sign
const fs=require('fs')
const aws=require('aws-sdk')
aws.config.region=config.region
const s3=new aws.S3()
const outputs=require('../../../../bin/exports')
const exists=require('./../util').exists
const run=require('./../util').run
const api=require('./../util').api
const faker=require('faker').lorem
const range=require('range').range

module.exports={
    question:function(test){
        const id="unit-test.1"
        exists(id,test,false)
        .then(()=>api({
            path:"questions/"+id,
            method:"PUT",
            body:{
                type:"qna",
                qid:id,
                q:["who am i"],
                a:"i am the unit",
                _trace:1
            }
        }))
        .then(()=>exists(id,test,true))
        .then(()=>api({
            path:"questions/"+id,
            method:"DELETE"
        }))
        .then(()=>exists(id,test,false))
        .finally(()=>test.done())
    },
    delete:{
        all:function(test){
            const id1="unit-test.1"
            const id2="unit-test.2"
            const one=api({
                path:"questions/"+id1,
                method:"PUT",
                body:{
                    type:"qna",
                    qid:id1,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            const two=api({
                path:"questions/"+id2,
                method:"PUT",
                body:{
                    type:"qna",
                    qid:id2,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            return Promise.all[(one,two)]
            .then(()=>api({
                path:"questions",
                method:"DELETE",
                body:{
                    query:"unit-test.*"
                }
            }))
            .then(()=>exists(id1,test,false))
            .then(()=>exists(id2,test,false))
            .finally(()=>test.done())
        },
        query:function(test){
            const id1="one.test"
            const id2="two.test"
            const one=api({
                path:"questions/"+id1,
                method:"PUT",
                body:{
                    type:"qna",
                    qid:id1,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            const two=api({
                path:"questions/"+id2,
                method:"PUT",
                body:{
                    type:"qna",
                    qid:id2,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            return Promise.all[(one,two)]
            .then(()=>api({
                path:"questions",
                method:"DELETE",
                body:{
                    query:"one.*"
                }
            }))
            .then(()=>exists(id1,test,false))
            .then(()=>exists(id2,test,true))
            /*.then(()=>api({
                path:"questions",
                method:"DELETE",
                body:{
                    query:".*test"
                }
            }))*/
            .finally(()=>test.done())
        },
        list:function(test){
            const id1="one.test"
            const id2="two.test"
            const one=api({
                path:"questions/"+id1,
                method:"PUT",
                body:{
                    type:"qna",
                    qid:id1,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            const two=api({
                path:"questions/"+id2,
                method:"PUT",
                body:{
                    type:"qna",
                    qid:id2,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            return Promise.all[(one,two)]
            .then(()=>api({
                path:"questions",
                method:"DELETE",
                body:{
                    list:["one.test"]
                }
            }))
            .then(()=>exists(id1,test,false))
            .then(()=>exists(id2,test,true))
            .then(()=>api({
                path:"questions",
                method:"DELETE",
                body:{
                    query:".*test"
                }
            }))
            .catch(console.log)
            .finally(()=>test.done())
        }
    },
    export:require('./export'),
    import:function(test){
        const count=20000
        const name=(new Date()).getTime()
        console.log(name)
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
                        .then(x => {
                            console.log(JSON.stringify(x, null, 2))
                            x.jobs.map(y=>y.id).includes(name) ?
                            setTimeout(()=>next(--i),2000) : res(x) 
                        })
                        .catch(x=> { 
                            console.log(x);
                            if (x.response.status === 404) {
                                setTimeout(() => next(--i), 2000)
                            } else {
                                rej(x)
                            }
                        })
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
                            path:"jobs/imports/"+name,
                            method:"GET"
                        })
                        .then(x => { 
                            console.log(JSON.stringify(x,null,2))
                            x.status==="InProgress" ?
                            setTimeout(()=>next(--i),2000) : res(x)
                        })
                        .catch(x=> { 
                            console.log(x);
                            if (x.response.status === 404) {
                                setTimeout(() => next(--i), 2000)
                            } else {
                                rej(x)
                            }
                        })
                    }else{
                        rej("timeout")
                    }
                }
                next(100)
            })
        })
        .then(x=>{
            console.log(x)
            test.equal(x.status,"Complete")
            test.equal(x.count,count)
        })
        .then(()=>api({
            path:"jobs/imports/"+name,
            method:"DELETE"
        }))
        .then(()=>api({
            path:"questions",
            method:"DELETE",
            body:{
                query:"bulk-test.*"
            }
        }))
        .finally(()=>test.done())
    }
}

function qna(index){
    return JSON.stringify({
        qid:"bulk-test."+index,
        q:range(0,1).map(x=>faker.sentence()),
        a:faker.sentence()
    })
}
