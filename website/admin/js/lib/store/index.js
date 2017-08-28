/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var Vuex=require('vuex')


module.exports=new Vuex.Store({
    state:{
        loggedIn:false,
        loading:false,
        QAs:[],
        results:[],
        client:{},
        username:"user",
        loaded:0,
        filter:{
            query:null
        },
        mode:"questions",
        page:{
            current:0,
            perpage:15,
            total:0
        },
        bot:{
            botname:"<i class='fa fa-spinner fa-pulse'></i>",
            slotutterances:[],
            lambdaArn:"<i class='fa fa-spinner fa-pulse'></i>",
            lambdaName:"<i class='fa fa-spinner fa-pulse'></i>"
        },
        error:null,
        selectIds:[]
    },
    mutations:require('./mutations'),
    getters:require('./getters'),
    actions:require('./actions')
})
