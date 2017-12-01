/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var sdk=require('../../../js/lib/api.js')
var cognito=require('../../../js/lib/cognito.js')

describe('Cognito', function() {
    var client

    before(function(){
        this.timeout(10000)
        return cognito.authenticated("Admin","123$dDadadfasdf")
        .tap(console.log)
        .then(function(creds){
            client=new sdk(creds.key,creds.secret,creds.token)    
            return client.ready
        })
    })
        
    it('cognitoUn',function(){
        return cognito.unauthenticated().tap(console.log).error(console.log)
    });
    
    it('cognitoAu',function(){
        this.timeout(10000)
        return cognito.authenticated("Admin","123$dDadadfasdf")
            .tap(console.log)
            .tapCatch(console.log)
    });

    it('list',function(){
        return client.list().tap(console.log)
    });
    it('add',function(){
        return client.add("test",["?"],"me").tap(console.log)
    });
    it('bulk',function(){
        return client.add([{qid:"",q:[],a:""},{qid:"",q:[],a:""}]).tap(console.log)
    });
    it('remove',function(){
        return client.remove("test").tap(console.log)
    });
    it('save',function(){
        this.timeout(5000)
        return client.save().tap(console.log)
    });
    it('search',function(){
        return client.search("who am i").tap(console.log)
    });
});
