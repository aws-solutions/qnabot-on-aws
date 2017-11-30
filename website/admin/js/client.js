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
var Vue=require('vue')
var Vuex=require('vuex').default
var Vuetify=require('vuetify').default
var style=require('aws-lex-web-ui/dist/lex-web-ui.css')
var Auth=require('./lib/client-auth')
var tooltip=require('v-tooltip')

Vue.use(tooltip,{defaultClass:"tooltip",defaultDelay:500})
Vue.use(Vuex)
Vue.use(Vuetify);

var config = {
  cognito:{},
  lex: {
    initialText:"Ask a Question",
    initialSpeechInstruction:"Speak a question to start",
    reInitSessionAttributesOnRestart: false
  },
  ui:{
    pageTitle:"QnA bot Client",
    toolbarColor:"cyan",
    toolbarTitle:"QnABot",
    toolbarLogo:null,
    pushInitialTextOnRestart:false
  },
  recorder:{}
}
document.addEventListener('DOMContentLoaded', function(){
    var Config=Promise.resolve(axios.get('/api/client')).get('data')
    .tap(console.log)
    .then(function(result){
        config.cognito.poolId=result.aws.cognitoPoolId
        config.lex.botName=result.iframeConfig.lex.botName
        config.ui.pageTitle=result.iframeConfig.lex.pageTitle
        return config
        console.log(config) 
    }) 

    Promise.join(Config,Auth())
    .spread(function(config,auth){
        
        var LexWebUi=require('aws-lex-web-ui/dist/lex-web-ui.js')
        var store=new Vuex.Store(LexWebUi.Store)
    
        Vue.use(LexWebUi.Plugin,{
            config,
            awsConfig:auth.config,
            lexRuntimeClient:auth.lex,
            pollyClient:auth.polly
        })

        var App=new Vue({
            template:'<lex-web-ui/>',
            store:store
        })
        App.$mount('#App')
    })
})   
