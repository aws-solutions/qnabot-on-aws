// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Promise=require('bluebird')
Promise.config({
    warnings:false
})
var Vue=require('vue')
var style=require('highlight.js/styles/solarized-light.css')
var Router=require('vue-router').default
var sync=require('vuex-router-sync').sync
var Vuex=require('vuex').default
import Vuetify from 'vuetify'
import IdleVue from 'idle-vue'
var Idle=require('idle-js')
var validate=require('vee-validate')
import VueClipboard from 'vue-clipboard2'
import app from './admin.vue'
var _=require('lodash')

Vue.use(validate,{
    classNames:{
        valid:"valid",
        invalid:"invalid"
    },
    events:"input|blur|focus"
})

Vue.use(VueClipboard)
Vue.use(Vuex)
Vue.use(Router)
Vue.use(Vuetify,{
theme:{
    primary: '#1fbcd3',
    accent: '#ffbb00',
    secondary: '#3157d5',
    info: '#0D47A1',
    warning: '#ffba21',
    error: '#a71000',
    success: '#1ddf48'
}})
    
var style=require('../style/app.styl')

var lib=require('./lib')

document.addEventListener('DOMContentLoaded',init)

function init(){
    var router=new Router(lib.router)
    var store=lib.store
    sync(store,router)
    router.replace('/loading')
        
    Vue.use(IdleVue, {
        idleTime: 45*60*1000,
        eventEmitter:new Vue(),
        store:store,
        startAtIdle:false
    })


    var App=new Vue({
        router,
        store,
        render:h=>h(app)
    })

    require('./lib/validator')(App)
    store.state.modal=App.$modal
    router.onReady(()=>App.$mount('#App'))

}
