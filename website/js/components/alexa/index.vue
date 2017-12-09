<template lang='pug'>
  v-container(grid-list-md)
    v-layout(column )
      v-flex
        v-card
          v-card-title 
            h3 Alexa Instructions
          v-card-text(class="pa-0")
            v-stepper(v-model="stepNumber" class="elevation-0")
              v-stepper-header
                v-stepper-step(
                  v-for="(step,index) in steps"
                  :key="index"
                  :step="index+1"
                  :complete="stepNumber>index") {{step.title}}
              v-stepper-items
                v-stepper-content(
                  v-for="(step,index) in steps"
                  :key="index"
                  :step="index+1")
                  v-card
                    v-card-text
                      span(v-html="step.text")
                    v-card-actions
                      v-btn(v-for="(y,x) in step.buttons"
                        :id="y.id"
                        :key="x"
                        :loading="y.loading"
                        @click="copy(y)") {{y.text}}
                      v-spacer
                      v-btn(@click="stepNumber--" v-if="index>0" ) back
                      v-btn(@click="stepNumber++" v-if="index+1<steps.length") next
</template>

<script>
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
var Promise=require('bluebird')
var markdown=require('marked')
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
      utterances:new clipboard('#Utterances',{
        text:function(){
          return self.$store.state.bot.utterances.join('\n')
        }
      }),
      schema:new clipboard('#IntentSchema',{
        text:function(){
          return JSON.stringify(require('./schema'))
        }
      }),
      arn:new clipboard('#LambdaArn',{
        text:function(){
          return self.$store.state.bot.lambdaArn
        }
      }),
      stepsRaw:require('./steps.js')
    }
  },
  components:{
  },
  computed:Object.assign(
    Vuex.mapState([
        'bot'
    ]),
    {invalid:function(){
      return this.$validator.errors.has('filter')
    },
    steps:function(){
      var self=this
      return _.map(this.stepsRaw,function(x){ 
        var temp=handlebars.compile(x.text)
        return {
          title:x.title,
          text:markdown(temp(self.$store.state.bot),{renderer}),
          buttons:x.buttons
        }}
      )
    }
    }
  ),
  created:function(){
    this.$store.dispatch('data/botinfo').catch(()=>null) 
  },
  methods:{
    copy:function(btn){
      btn.loading=true
      setTimeout(()=>btn.loading=false,1000)
    }
  } 
}
</script>
