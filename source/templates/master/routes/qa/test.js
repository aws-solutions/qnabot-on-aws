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

process.argv.push('--debug');
const run = require('../util/temp-test').run;
const input = require('../util/temp-test').input;
module.exports={
    single:{
        head:{
            send:test=>run(__dirname+'/'+'single/head',static(),test),
            resp:test=>run(__dirname+'/'+'single/head.resp',static(),test)
        },
        delete:{
            send:test=>run(__dirname+'/'+'single/delete',static(),test),
            resp:function(test){
                const body={
                    '_shards':{
                        successful:2
                    },
                    '_id':2,
                    result:'delete'
                }
                run(__dirname+'/'+'single/delete.resp',input(body),test)
            }
        },
        put:{
            send:function(test){
                const body={  
                    qid:'adad',
                    q:['b','c'],
                    card:{
                        title:''
                    }
                }
                run(__dirname+'/'+'single/put',input(body),test)
            },
            resp:function(test){
                const body={
                    '_shards':{
                        successful:2
                    },
                    '_id':2,
                    result:'created'
                }
                run(__dirname+'/'+'single/put.resp',input(body),test)
            }
        }
    },
    collection:{
        options:{
            send:function(test){
                run(__dirname+'/'+'single/options',input({}),test)
            }
        },
        delete:{
            sendQuery:function(test){
                const body={query:'.*'}
                run(__dirname+'/'+'collection/delete',input(body),test)
            },
            sendList:function(test){
                const body={list:['ad','Ad']}
                run(__dirname+'/'+'collection/delete',input(body),test)
            },
            resp:test=>run(__dirname+'/'+'collection/delete.resp',input({
                deleted:100
            }),test),
        },
        get:test=>run(__dirname+'/'+'single/get',{
            input:{
                body:'{}',
                params:name=>{return {
                    from:'',
                    filter:'',
                    query:'',
                    perpage:'0'
                }[name]}
            }
        },test),
        list:test=>run(__dirname+'/'+'single/get',{
            input:{
                body:'{}',
                params:name=>{return {
                    from:'',
                    filter:'filter',
                    query:'',
                    perpage:''
                }[name]}
            }
        },test),
        search:test=>run(__dirname+'/'+'single/get',{
            input:{
                body:'{}',
                params:name=>{return {
                    from:'',
                    filter:'',
                    query:'search',
                    perpage:'',
                    topic:''
                }[name] }
            }
        },test),
        resp:function(test){
            const body={
                hits:{
                    total:10,
                    hits:[{
                        _score:10,
                        _id:'1',
                        _source:{
                            questions:[{q:'1'},{q:'2'}],
                            qid:'',
                            card:{
                                a:'1'
                            }
                        }
                    },{
                        _score:9,
                        _id:'2',
                        _source:{
                            questions:[{q:'1'},{q:'2'}],
                            qid:'',
                            card:{
                                a:'1'
                            }
                        }
                    }]
                }
            }
            run(__dirname+'/'+'single/get.resp',input(body),test)
        },
        import:test=>run(__dirname+'/'+'single/put',{
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



