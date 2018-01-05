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
var exists=require('./util').exists
var run=require('./util').run
var api=require('./util').api

module.exports={
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
        .tap(x=>test.ok(x.sessionAttributes.previous))
        .then(console.log)
        .finally(test.done)
    },
    miss:function(test){
        this.lex.postText({
            inputText:"zzzzzzzzzzzzzzzzzzz"
        }).promise()
        .tap(x=>test.equal(x.dialogState,"ElicitIntent"))
        .then(console.log)
        .finally(test.done)
    },
    empty:function(test){
        this.lex.postText({
            inputText:"help"
        }).promise()
        .tap(x=>test.equal(x.dialogState,"Fulfilled"))
        .then(console.log)
        .finally(test.done)
    },
    card:function(test){
        var self=this
        var id="unit-test.1"
        var id2="unit-test.2"
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
        .then(()=>api({
            path:"questions/"+id2,
            method:"PUT",
            body:{
                qid:id,
                q:["who are you"],
                a:"you are the test"
            }
        }))
        .then(()=>self.lex.postText({
            inputText:"who am i"
        }).promise())
        .tap(x=>test.ok(x.responseCard))
        .then(console.log)
        .then(()=>self.lex.postText({
            inputText:"who are you"
        }).promise())
        .tap(x=>test.ok(!x.responseCard))
        .then(console.log)
        .then(()=>api({
            path:"questions/unit-test.1",
            method:"DELETE"
        }))
        .then(()=>api({
            path:"questions/unit-test.2",
            method:"DELETE"
        }))
        .catch(test.ifError)
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

