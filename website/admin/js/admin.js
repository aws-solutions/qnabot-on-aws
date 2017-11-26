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
Promise.config({
    warnings:false
})
var Vue=require('vue')

var Router=require('vue-router').default
var Vuex=require('vuex').default
var VueTyperPlugin = require('vue-typer').default
var Idle=require('idle-js')
var validate=require('vee-validate')
var tooltip=require('v-tooltip')

Vue.use(validate,{
    classNames:{
        valid:"valid",
        invalid:"invalid"
    },
    events:"input|blur|focus"
})

Vue.use(tooltip,{defaultClass:"tooltip",defaultDelay:500})
Vue.use(VueTyperPlugin)
Vue.use(Vuex)
Vue.use(Router)

var lib=require('./lib')

document.addEventListener('DOMContentLoaded',init)

function init(){

    var router=new Router(lib.router)
    var store=lib.store
    Vue.component('icon',require('vue-awesome'))
    var App=new Vue({
        router,
        store,
        computed:Vuex.mapState([
            'loggedIn','loading','error'
        ]),
        template:`
            <main id="App">
                <router-view ></router-view>
                <div class="modal" v-show="error">
                  <div class="modal-card">
                      <p>{{error}}</p>
                      <button @click="$store.commit('clearError')" >Close</button>
                  </div>
                </div>
            </main>
        `
    })
    
    App.$validator.extend('json', {
        getMessage: field => 'invalid json',
        validate: function(value){
            try {
                var card=JSON.parse(value)
                var v =new  (require('jsonschema').Validator)();
                var valid=v.validate(card,require('./lib/card-schema')).valid
                return valid
            } catch(e){
                return false
            }
        }
    });
    
    App.$validator.extend('optional', {
        getMessage: field => 'invalid characters',
        validate: function(value){
            try {
                return value.match(/.*/) ? true : false
            } catch(e){
                return false
            }
        }
    });
   
    store.state.modal=App.$modal
    router.onReady(()=>App.$mount('#App'))
}
