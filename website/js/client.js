/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/
require("babel-polyfill");
var axios=require('axios')
var Vue=require('vue')
var Vuex=require('vuex').default
import Vuetify from 'vuetify'
var style=require('aws-lex-web-ui/dist/lex-web-ui.css')
var Auth=require('./lib/client-auth')

Vue.use(Vuex)
Vue.use(Vuetify);

var config = {
  cognito:{},
  lex: {
    initialText:"Ask a Question",
    initialSpeechInstruction:"",
    reInitSessionAttributesOnRestart: false
  },
  ui:{
    pageTitle:"QnABot Client",
    toolbarColor:"cyan",
    toolbarTitle:"QnABot",
    toolbarLogo:null,
    pushInitialTextOnRestart:false,
    AllowSuperDangerousHTMLInMessage:true,
    showDialogStateIcon:false,
  },
  recorder:{}
}
document.addEventListener('DOMContentLoaded', function(){
    var Config=Promise.resolve(axios.head(window.location.href))
    .then(function(result){
        var stage=result.headers['api-stage']
        return Promise.resolve(axios.get(`/${stage}`)).then(x=>x['data'])
    })

    .then(function(result){
        config.cognito.poolId=result.PoolId
        config.lex.botName=result.BotName
        config.lex.botAlias=result.BotVersion
        return config
        console.log(config) 
    }) 

    Promise.all([
        Config,
        Auth(),
        require('./client.vue')
    ])
    .then(function(results){
        console.log(results)
        var config=results[0]
        var auth=results[1]
        var app=results[2]

        var LexWebUi=require('aws-lex-web-ui/dist/lex-web-ui.js')
        var store=new Vuex.Store(LexWebUi.Store)
        if(auth.username){
            config.ui.toolbarTitle+=":"+auth.username
        }
        store.state.Login=auth.Login
        store.state.Username=auth.username
        Vue.use(LexWebUi.Plugin,{
            config,
            awsConfig:auth.config,
            lexRuntimeClient:auth.lex,
            pollyClient:auth.polly
        })

        var App=new Vue({
            render:h=>h(app),
            store:store
        })
        App.$mount('#App')
    })
})   
