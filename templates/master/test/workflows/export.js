var config=require('../../../../config')
process.env.AWS_PROFILE=config.profile
process.env.AWS_DEFAULT_REGION=config.region
var _=require('lodash')
var Promise=require('bluebird')
var api=require('../util').api
var faker=require('faker').lorem
var range=require('range').range
var aws=require('aws-sdk')
aws.config.setPromisesDependency(Promise)
aws.config.region=config.region
var s3=new aws.S3()

module.exports={
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
        try{ 
            var completed=await new Promise(async function(res,rej){
                next(100)
                async function next(count){
                    var status=await api({
                        href:`${info._links.exports.href}/test-all`,
                        method:"GET",
                    })
                    if(status.status==="Completed"){
                        res(status)
                    }else if(status.status==="InProgress"){
                        count>0 ? setTimeout(()=>next(--count),1000) : rej("timeout")
                    }else if(status.status==="Started"){
                        count>0 ? setTimeout(()=>next(--count),1000) : rej("timeout")
                    }else{
                        rej(status)
                    }
                }
            })
            console.log(completed)
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
    }
}

function qna(index){
    return JSON.stringify({
        qid:"bulk-test."+index,
        q:range(0,1).map(x=>faker.sentence()),
        a:faker.sentence()
    })
}
