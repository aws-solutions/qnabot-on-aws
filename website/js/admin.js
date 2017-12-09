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
var sync=require('vuex-router-sync').sync
var Vuex=require('vuex').default
var vuetify=require('vuetify').default
var Idle=require('idle-js')
var validate=require('vee-validate')

Vue.use(validate,{
    classNames:{
        valid:"valid",
        invalid:"invalid"
    },
    events:"input|blur|focus"
})

Vue.use(Vuex)
Vue.use(Router)
Vue.use(vuetify,{
    theme:{
        primary: '#fff',
        secondary: '#424242',
        accent: '#82B1FF',
        error: '#FF5252',
        info: '#2196F3',
        success: '#4CAF50',
        warning: '#FFC107'
    }
})
var style=require('../../node_modules/vuetify/dist/vuetify.min.css')

var lib=require('./lib')
document.addEventListener('DOMContentLoaded',init)

function init(){
    var router=new Router(lib.router)
    var store=lib.store
    sync(store,router)
    store.commit('user/captureHash')
    router.replace('/loading')

    System.import(/* webpackChunkName: "admin-page" */'./admin.vue')
    .then(function(app){
        var App=new Vue({
            router,
            store,
            render:h=>h(app)
        })
        
        require('./lib/validator')(App)        
        store.state.modal=App.$modal
        router.onReady(()=>App.$mount('#App'))
    })
}
