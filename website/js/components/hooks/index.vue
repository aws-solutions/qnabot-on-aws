<template lang='pug'>
  v-container(grid-list-md)
    v-layout(column )
      v-flex
        v-card
          v-card-title 
            h3 Lambda Hook Instructions
          v-card-text(class="pa-0")
            v-stepper(v-model="stepNumber" class="elevation-0")
              v-stepper-header
                template(v-for="(step,index) in steps")
                  v-divider(v-if='index>0')
                  v-stepper-step(
                    :key="index"
                    :step="index+1"
                    :complete="stepNumber>index") {{step.title}}
                      small(v-if="step.optional") optional
              v-stepper-items
                v-stepper-content(
                  v-for="(step,index) in steps"
                  :key="index"
                  :step="index+1")
                  v-card
                    v-card-text
                      .headline.text-xs-center {{step.title}}
                      span(v-html="step.text")
                    v-card-actions
                      v-btn(v-for="(y,x) in step.buttons"
                        :id="y.id"
                        :key="x"
                        :loading="y.loading"
                        @click="copy(y)") {{y.text}}
                    v-card-actions
                      v-spacer
                      v-btn(@click="stepNumber--" v-if="index>0" ) back
                      v-btn(@click="stepNumber++" v-if="index+1<steps.length") next
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
var Promise=require('bluebird')
var markdown=require('marked')

import hljs from 'highlight.js/lib/core';
import javascriptlang from 'highlight.js/lib/languages/javascript';
import pythonlang from 'highlight.js/lib/languages/python';
import jsonlang from 'highlight.js/lib/languages/json';
hljs.registerLanguage('javascript', javascriptlang);
hljs.registerLanguage('python', pythonlang);
hljs.registerLanguage('json', jsonlang);

markdown.setOptions({
  highlight: function (code) {
    return hljs.highlightAuto(code).value;
  }
});
var renderer=new markdown.Renderer()
renderer.link=function(href,title,text){
  return `<a href="${href}" title="${title}" target="_blank">${text}</a>` 
}
var handlebars=require('handlebars')
var clipboard=require('clipboard')
var _=require('lodash')

module.exports={
  data:function(){
    var self=this
    return {
      visible:false,
      stepNumber:1,
      prefix:"qna",
      stepsRaw:require('./steps.js')
    }
  },
  components:{
  },
  computed:Object.assign(
    Vuex.mapState([
        'bot'
    ]),
    
    {
    steps:function(){
      var self=this
      return _.map(this.stepsRaw,function(x){ 
        var temp=handlebars.compile(x.text)
        var y=Object.assign({},x)
        y.text=markdown(temp(self.$store.state.bot),{renderer})
        return y
      })
    }
    }
  ),
  created:function(){
    var self=this
    this.$store.dispatch('data/botinfo').catch(()=>null) 
    var role=new clipboard('#Role',{
      text:function(){
        return self.$store.state.bot.lambdaRole
      }
    })
    var codeJS=new clipboard('#code-js',{
        text:function(){
          return require('raw-loader!./code.js')
        }
    })
    var codePY=new clipboard('#code-py',{
        text:function(){
          return require('raw-loader!./code.py')
        }
    })
    var request=new clipboard('#request',{
        text:function(){
          return JSON.stringify(require('./example'),null,2)
        }
    })
  },
  methods:{
    copy:function(btn){
      btn.loading=true
      setTimeout(()=>btn.loading=false,1000)
    }
  } 
}
</script>
