var fs=require('fs')
process.argv.push('--debug')
var Velocity=require('velocity')
var run=require('../util/temp-test').run
var input=require('../util/temp-test').input
module.exports={
    single:{
        head:{
            send:test=>run(__dirname+'/'+"single/head",static(),test),
            resp:test=>run(__dirname+'/'+"single/head.resp",static(),test)
        },
        delete:{
            send:test=>run(__dirname+'/'+"single/delete",static(),test),
            resp:function(test){
                var body={
                    "_shards":{
                        successful:2
                    },
                    "_id":2,
                    result:"delete"
                }
                run(__dirname+'/'+"single/delete.resp",input(body),test)
            }
        },
        put:{
            send:function(test){
                var body={  
                    qid:"adad",
                    q:["b","c"],
                    card:{
                        title:""
                    }
                }
                run(__dirname+'/'+"single/put",input(body),test)
            },
            resp:function(test){
                var body={
                    "_shards":{
                        successful:2
                    },
                    "_id":2,
                    result:"created"
                }
                run(__dirname+'/'+"single/put.resp",input(body),test)
            }
        }
    },
    collection:{
        options:{
            send:function(test){
                run(__dirname+'/'+"single/options",input({}),test)
            }
        },
        delete:{
            sendQuery:function(test){
                var body={query:".*"}
                run(__dirname+'/'+"collection/delete",input(body),test)
            },
            sendList:function(test){
                var body={list:["ad","Ad"]}
                run(__dirname+'/'+"collection/delete",input(body),test)
            },
            resp:test=>run(__dirname+'/'+"collection/delete.resp",input({
                deleted:100
            }),test),
        },
        puts:{
            resp:function(test){
                var body={
                    took:30,
                    errors:false,
                    items:[{
                        index:{
                            status:200,
                            _id:1
                        }
                    },{
                        index:{
                            status:200,
                            _id:2
                        }
                    }]
                }
                run(__dirname+'/'+"collection/put.resp",input(body),test)
            },
            send:function(test){
                var body=[{qid:3,a:1},{qid:2,a:2}]
                run(__dirname+'/'+"collection/put",input(body),test)
            }
        },
        get:test=>run(__dirname+'/'+"single/get",{
            input:{
                body:'{}',
                params:name=>{return {
                    from:"",
                    filter:"",
                    query:"",
                    perpage:"0"
                }[name]}
            }
        },test),
        list:test=>run(__dirname+'/'+"single/get",{
            input:{
                body:'{}',
                params:name=>{return {
                    from:"",
                    filter:"filter",
                    query:"",
                    perpage:""
                }[name]}
            }
        },test),
        search:test=>run(__dirname+'/'+"single/get",{
            input:{
                body:'{}',
                params:name=>{return {
                    from:"",
                    filter:"",
                    query:"search",
                    perpage:"",
                    topic:""
                }[name] }
            }
        },test),
        resp:function(test){
            var body={
                hits:{
                    total:10,
                    hits:[{
                        _score:10,
                        _id:"1",
                        _source:{
                            questions:[{q:"1"},{q:"2"}],
                            qid:"",
                            card:{
                                a:"1"
                            }
                        }
                    },{
                        _score:9,
                        _id:"2",
                        _source:{
                            questions:[{q:"1"},{q:"2"}],
                            qid:"",
                            card:{
                                a:"1"
                            }
                        }
                    }]
                }
            }
            run(__dirname+'/'+"single/get.resp",input(body),test)
        },
        import:test=>run(__dirname+'/'+"single/put",{
            input:{
                body:'{}',
                json:()=>'{}',
                params:()=>'notall'
            }
        },test)
    }
}

function static(){
    return {
        input:{
            params:()=>'id'
        }
    }
}



