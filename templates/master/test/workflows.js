var config=require('../../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
var query=require('query-string').stringify
var _=require('lodash')
var zlib=require('zlib')
var Promise=require('bluebird')
var axios=require('axios')
var Url=require('url')
var sign=require('aws4').sign
var fs=require('fs')
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var s3=new aws.S3()
var outputs=require('../../../bin/exports')
var exists=require('./util').exists
var run=require('./util').run
var api=require('./util').api
var faker=require('faker').lorem
var range=require('range').range

module.exports={
    question:function(test){
        var id="unit-test.1"
        exists(id,test,false)
        .then(()=>api({
            path:"questions/"+id,
            method:"PUT",
            body:{
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
            var id1="unit-test.1"
            var id2="unit-test.2"
            var one=api({
                path:"questions/"+id1,
                method:"PUT",
                body:{
                    qid:id1,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            var two=api({
                path:"questions/"+id2,
                method:"PUT",
                body:{
                    qid:id2,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            return Promise.join(one,two)
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
            var id1="one.test"
            var id2="two.test"
            var one=api({
                path:"questions/"+id1,
                method:"PUT",
                body:{
                    qid:id1,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            var two=api({
                path:"questions/"+id2,
                method:"PUT",
                body:{
                    qid:id2,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            return Promise.join(one,two)
            .then(()=>api({
                path:"questions",
                method:"DELETE",
                body:{
                    query:"one.*"
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
            .finally(()=>test.done())
        },
        list:function(test){
            var id1="one.test"
            var id2="two.test"
            var one=api({
                path:"questions/"+id1,
                method:"PUT",
                body:{
                    qid:id1,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            var two=api({
                path:"questions/"+id2,
                method:"PUT",
                body:{
                    qid:id2,
                    q:["who am i"],
                    a:"i am the unit"
                }
            })

            return Promise.join(one,two)
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
    export:{
        setUp:function(done){
            var count=10000
            var name=(new Date()).getTime()
            this.name=name
            api({
                path:"jobs",
                method:"GET"
            })
            .then(x=>x._links.imports)
            .tap(info=>s3.putObject({
                Bucket:info.bucket,
                Key:info.uploadPrefix+name,
                Body:range(0,count).map(qna).join('\n')
            }).promise())
            .tap(function(info){
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
                                path:"jobs/imports/"+name,
                                method:"GET"
                            })
                            .tapCatch(console.log)
                            .then(x=>x.status==="InProgress" ? 
                                setTimeout(()=>next(--i),2000) : res(x) )
                            .catch(x=>x.response.status===404,
                                ()=>setTimeout(()=>next(--i),2000))
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
            var info=await api({
                path:"jobs",
                method:"GET"
            })

            var start=await api({
                href:`${info._links.exports.href}/test-all`,
                method:"PUT",
                body:{}
            })

            var status=await api({
                href:`${info._links.exports.href}/test-all`,
                method:"GET",
            })
            var status=await api({
                href:`${info._links.exports.href}/test-all`,
                method:"DELETE",
            })
            console.log(status)
            test.done()             
        },
        filter:async function(test){
            var info=await api({
                path:"jobs",
                method:"GET"
            })
            var start=await api({
                href:`${info._links.exports.href}/test-filter`,
                method:"PUT",
                body:{
                    filter:"none.*" 
                }
            })
            var status=await api({
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
        },
    },
    import:function(test){
        var count=20000
        var name=(new Date()).getTime()
        console.log(name)
        api({
            path:"jobs",
            method:"GET"
        })
        .then(x=>x._links.imports)
        .tap(info=>s3.putObject({
            Bucket:info.bucket,
            Key:info.uploadPrefix+name,
            Body:range(0,count).map(qna).join('\n')
        }).promise())
        .tap(function(info){
            return new Promise(function(res,rej){
                function next(i){
                    console.log("tries left:"+i)
                    if(i>0){
                        api({
                            path:"jobs/imports",
                            method:"GET"
                        })
                        .tap(x=>console.log(JSON.stringify(x,null,2)))
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
                            path:"jobs/imports/"+name,
                            method:"GET"
                        })
                        .tap(x=>console.log(JSON.stringify(x,null,2)))
                        .tapCatch(console.log)
                        .then(x=>x.status==="InProgress" ? 
                            setTimeout(()=>next(--i),2000) : res(x) )
                        .catch(x=>x.response.status===404,
                            ()=>setTimeout(()=>next(--i),2000))
                        .catch(rej)
                    }else{
                        rej("timeout")
                    }
                }
                next(100)
            })
        })
        .tap(console.log)
        .tap(x=>{
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
