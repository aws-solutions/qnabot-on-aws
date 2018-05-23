/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var create=require('./lib/create.js')
var aws=require('./lib/util/aws')
var Lambda=new aws.Lambda()

module.exports=class Kibana extends require('../base'){
    constructor(){
        super()        
        Object.assign(this,{
            LongRunning:{
                PingInSeconds: 30,
                MaxPings: 30,
                LambdaApi: Lambda,
                Methods: {
                    Create: function(createReponse, params, reply, notDone){
                        var con=(require('./lib/con.js'))(params.address)

                        con.retry(function(){
                            return create(params)
                            .then(()=>reply(null))
                        })
                        .tapCatch(console.log)
                        .catch(notDone)
                    }
                }
            }
        })
    }
}
