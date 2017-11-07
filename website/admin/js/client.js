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
    Promise.resolve(axios.get('/api/client')).get('data')
    .tap(console.log)
    .then(function(result){
        config.cognito.poolId=result.aws.cognitoPoolId
        config.lex.botName=result.iframeConfig.lex.botName
        config.ui.pageTitle=result.iframeConfig.lex.pageTitle
        console.log(config) 
        
        var LexWebUi=require('aws-lex-web-ui/dist/lex-web-ui.js').Loader
        const lexWebUi = new LexWebUi(config)
        var App=new Vue({
            template:'<client/>',
            store:lexWebUi.store,
            components:{
                client:require('./components/client/index.vue')
            }
        })
        App.$mount('#App')
    })
})   
