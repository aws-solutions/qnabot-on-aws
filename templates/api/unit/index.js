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
var env=require('../../../bin/exports')()

module.exports={
    proxyEs:require('../proxy-es/test'),
    proxyLex:require('../proxy-lex/test'),
    templates:require('../routes/test'),
    routes:{
        root:{
            get:test=>run({
                path:"",
                method:"get"
            },test)
        },
        bot:{
            get:test=>run({
                path:"bot",
                method:"get"
            },test),
            alexa:{
                get:test=>run({
                    path:"bot/alexa",
                    method:"get"
                },test)
            },
            hooks:{
                get:test=>run({
                    path:"bot/hooks",
                    method:"get"
                },test),
                options:test=>run({
                    path:"bot/hooks",
                    method:"options"
                },test)
            },
            utterances:{
                get:test=>run({
                    path:"bot/utterances",
                    method:"get"
                },test)
            }
        },
        health:{
            get:test=>run({
                path:"health",
                method:"get"
            },test)
        },
        pages:{
             client:test=>run({
                path:"pages/client",
                method:"get"
            },test),
            designer:test=>run({
                path:"pages/designer",
                method:"get"
            },test)
        },
        static:{
            get:test=>run({
                path:"static/index.html",
                method:"get"
            },test),
            head:test=>run({
                path:"static/index.html",
                method:"head"
            },test)
        },
        qa:{
            list:test=>run({
                path:"questions",
                method:"get"
            },test),
            filter:test=>run({
                path:"questions?filter=who",
                method:"get"
            },test),
            search:test=>run({
                path:"questions?query=who",
                method:"get"
            },test),
            options:test=>run({
                path:"questions?",
                method:"options"
            },test)
        }
    },
    workflows:{
        question:function(test){
            test.expect(2)
            var id="unit-test.1"
            exists(id,test,false)
            .then(()=>api({
                path:"questions/"+id,
                method:"PUT",
                body:{
                    qid:"unit-test-.1",
                    q:["who am i"],
                    a:"i am the unit",
                    _trace:1
                }
            }))
            .then(()=>exists(id,test,true))
            .then(()=>api({
                path:"questions/unit-test.1",
                method:"PUT",
                body:{
                    qid:"unit-test.1",
                    q:["who am i"],
                    a:"i am the unit",
                    _trace:2
                }
            }))
            .then(()=>api({
                path:"questions/unit-test.1",
                method:"DELETE"
            }))
            .then(()=>exists(id,test,true))
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
                .finally(()=>test.done())
            }
        },
        import:function(test){
            var id="unit-test.1"
            exists(id,test,false)
            .then(()=>api({
                path:"questions",
                method:"PUT",
                body:[{
                    qid:id,
                    q:["who am i"],
                    a:"i am the unit"
                }]
            }))
            .then(()=>exists(id,test,true))
            .then(()=>api({
                path:"questions/"+id,
                method:"DELETE"
            }))
            .then(()=>exists(id,test,false))
            .finally(()=>test.done())
        },
        hooks:{
            //get 
            //update
            //replace
        }
    },
    lex:{
        setUp:function(cb){
            var self=this
            env.then(function(envs){
                self.lex=new aws.LexRuntime({
                    region:config.region,
                    params:{
                        botAlias:envs["QNA-DEV-BOT-ALIAS"],
                        botName:envs["QNA-DEV-BOT-NAME"],
                        userId:"test"
                    }
                })
            })
            .then(cb)
        },
        ask:function(test){
            this.lex.postText({
                inputText:"hello"
            }).promise()
            .then(console.log)
            .finally(test.done)
        },
        card:function(test){
            var self=this
            var id="unit-test.1"
            api({
                path:"questions/"+id,
                method:"PUT",
                body:{
                    qid:id,
                    q:["who am i"],
                    a:"i am the unit",
                    r:{
                        title:"test",
                        text:"test",
                        url:"https://dummyimage.com/600x400/000/fff.png&text=hello"
                    }
                }
            })
            .then(()=>self.lex.postText({
                inputText:"who am i"
            }).promise())
            .then(console.log)
            .then(()=>api({
                path:"questions/unit-test.1",
                method:"DELETE"
            }))
            .finally(()=>test.done())
        },
        topic:function(test){
            var self=this
            var id1="unit-test.1"
            var id2="unit-test.2"
            return api({
                path:"questions",
                method:"PUT",
                body:[{
                    qid:id1,
                    q:["what do zombies eat","what do they eat"],
                    a:"zombies eat brains",
                    t:"zombies"
                },{
                    qid:id2,
                    q:["what do humans eat","what do they eat"],
                    a:"humans eat food",
                    t:"humans"
                }]
            })
            .then(()=>self.lex.postText({
                inputText:"what do zombies eat",
                sessionAttributes:{}
            }).promise().tap(console.log))
            .then(res=>test.equal(res.sessionAttributes.topic,"zombies"))
            .then(()=>self.lex.postText({
                inputText:"what do they eat",
                sessionAttributes:{
                    topic:"zombies" 
                }
            }).promise().tap(console.log))
            .then(res=>test.equal(res.sessionAttributes.topic,"zombies"))
            .then(()=>self.lex.postText({
                inputText:"what do humans eat",
                sessionAttributes:{}
            }).promise().tap(console.log))
            .then(res=>test.equal(res.sessionAttributes.topic,"humans"))
            .finally(()=>test.done())
        },
        hook:function(test){
            var self=this
            var id1='unit-test.1'
            var lambda=new aws.Lambda({
                region:config.region
            })
            var func=env.then(function(envs){
                return lambda.updateFunctionCode({
                    FunctionName:envs["QNA-DEV-LAMBDA"],
                    Publish:true,
                    ZipFile:fs.readFileSync(__dirname+'/hook.zip')
                }).promise()
            })

            var qa=env.then(envs=>api({
                path:"questions",
                method:"PUT",
                body:[{
                    qid:id1,
                    q:["what do zombies eat","what do they eat"],
                    a:"zombies eat brains",
                    l:envs["QNA-DEV-LAMBDA"]
                }]
            }))
            .then(()=>self.lex.postText({
                inputText:"what do zombies eat",
                sessionAttributes:{}
            }).promise().tap(console.log))
            .then(res=>test.equal(res.message,"hook"))
            .then(()=>api({
                path:"questions/"+id1,
                method:"DELETE"
            }))
            .finally(()=>test.done())
        }
    }
}
function exists(id,test,not=true){
    return api({
        path:"questions/"+id,
        method:"HEAD"
    })
    .then(()=>not ? test.ok(true) : test.ifError(true))
    .catch(()=>!not ? test.ok(true) : test.ifError(true))
}
function run(opts,test){
    return api(opts)
    .then(result=>{
        test.ok(opts.method.toUpperCase()==='HEAD' ? true : result)
    })
    .catch(test.ifError)
    .finally(()=>test.done())
}

function  api(opts){
    return env.then(function(envs){
        var url=Url.parse(envs["QNA-DEV-MASTER-API"]+'/'+opts.path)
        var request={
            host:url.hostname,
            method:opts.method.toUpperCase(),
            url:url.href,
            path:url.path,
            headers:opts.headers || {}
        }
        if(opts.body){
            request.body=JSON.stringify(opts.body),
            request.data=opts.body,
            request.headers['content-type']='application/json'
        }
        console.log("Request",JSON.stringify(request,null,2))

        var credentials=aws.config.credentials 
        var signed=sign(request,credentials)        
        delete request.headers["Host"]
        delete request.headers["Content-Length"]        
        
        return Promise.resolve(axios(signed))
        .get('data')
        .tap(x=>console.log("response:",JSON.stringify(x,null,2)))
    })
}
