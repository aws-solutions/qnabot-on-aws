/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Promise=require('bluebird')
var axios=require('axios')
var cognito=new (require('./cognito.js'))()
var reason=function(r){
    return (err)=>{ 
        console.log(err)
        Promise.reject(r)
    }
}
var apigClientFactory=require('./sdk')
module.exports=class {
    constructor(credentials){
        var self=this 
        self.credentials=credentials
        self.cache=new (require('quick-lru'))({maxSize:10})
        self.ready=self._request("get","info")
        .tap(config=>self.config=config)
        .then(function(config){
            self.config={
                invokeUrl:config.ApiUrl,
                region:config.region,
                accessKey:credentials.accessKeyId,
                secretKey:credentials.secretAccessKey,
                sessionToken:credentials.sessionToken,
                Id:config.Id
            }
            self.Id=config.Id
            self.client=apigClientFactory.newClient(self.config);
        })
        .tapCatch(self.relogin)
    }
    check_refresh(){
        var self=this
        if(self.credentials.needsRefresh()){
            console.log("refreshing credentials")
            return self.credentials.refreshPromise()
                .then(function(){
                    self.config.accessKey=self.credentials.accessKeyId
                    self.config.secretKey=self.credentials.secretAccessKeyId
                    self.config.sessionToken=self.credentials.sessionToken
                    self.client=apigClientFactory.newClient(self.config);
                    console.log("credentials refreshed")
                })
        }else{
            return Promise.resolve()
        }
    }
    _request(method,path,body){
        var self=this
        return Promise.resolve(axios({
            method:method.toUpperCase(),
            url:"/api/"+path,
            data:body
        }))
        .tap(function(result){
            if(result.status!==200)return Promise.reject('info request failed') 
        })
        .tap(console.log)
        .get('data')
    }
    botinfo(){
        var self=this
        console.log(self.client)
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.botGet(
            {},
            {},
            {}
        )))
        .get('data')
        .catch(reason("Failed to get BotInfo")) 
    }
    bulk(body){
        var self=this
        self.cache.clear()
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.rootPut(
            {},
            body.qna,
            {}
        )))
        .catch(reason("Failed to Bulk upload")) 
    }
    list(page=0,filter="",perpage=10){
        var self=this
        var key=JSON.stringify(arguments)
    
        if(self.cache.has(key)){
            return Promise.resolve(self.cache.get(key))
        }else{
            var param= {from:page,filter:filter||"",perpage}
            return self.ready
            .then(()=>self.check_refresh())
            .then(()=>Promise.resolve(self.client.rootGet(
                param,
                {},
                {}
            )))
            .get('data')
            .tap(data=>self.cache.set(key,data))
            .catch(reason("Failed to get page:"+page)) 
        }
    }
    check(qid){
        var self=this
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.idHead(
            {Id:qid},
            [],
            {}
        )))
        .then(()=>false)
        .catch(()=>true)
    }
    add(questions,anwser,card,qid){
        card.imageUrl=card.imageUrl.trim() 
        var self=this
        self.cache.clear()
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.rootPut(
            {},
            [{
                qid,
                q:questions,
                a:anwser,
                r:card
            }],
            {}
        )))
        .get("data")
        .catch(reason("Failed to add")) 
    }
    update(Id,questions,anwser,qid,card){
        card.imageUrl=card.imageUrl.trim() 
        var self=this
        self.cache.clear()
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.idPut(
            {Id:qid},
            [{
                qid:qid,
                q:questions || [],
                a:anwser,
                r:card
            }],
            {}
        )))
        .get("data")
        .catch(reason("Failed to Update")) 
    }
    remove(Id){
        var self=this
        self.cache.clear()
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.idDelete(
            {Id},
            {empty:""},
            {}
        )))
        .get("data")
        .catch(reason("Failed to remove")) 
    }
    build(){
        var self=this
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.botPost({},{empty:""},{})))
        .get("data")
        .catch(reason("Failed to build")) 
    }
    status(){
        var self=this
        return self.ready
        .then(()=>self.check_refresh())
        .then(()=>Promise.resolve(self.client.botStatusGet({},{},{})))
        .get("data")
        .catch(reason("Failed to get status")) 
    }
    search(question){
        var self=this
        var key=JSON.stringify(arguments)
    
        if(self.cache.has(key)){
            return Promise.resolve(self.cache.get(key))
        }else{
            return self.ready
            .then(()=>self.check_refresh())
            .then(()=>Promise.resolve(self.client.searchGet(
                {query:question,from:0},{},{}
            )))
            .get("data")
            .tap(data=>self.cache.set(key,data))
            .catch(reason("Failed to search")) 
        }
    }
}






