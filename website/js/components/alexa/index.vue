<template lang='pug'>
  v-card
    v-card-title 
      h3 Alexa Instructions
    v-card-text
      v-stepper(v-model="step")
        v-stepper-header
          v-stepper-step(step='1' :complete="step>1") setup
          v-stepper-step(step='2' :complete="step>2") developer console
          v-stepper-step(step='3' :complete="step>3") create skill
          v-stepper-step(step='4' :complete="step>3") test
        v-stepper-items
          v-stepper-content(step='1')
            p Sign into the 
              a(href="https://developer.amazon.com/home.html"  target="_blank") Amazon Developer Console
            v-btn(@click="step++") next
          v-stepper-content(step='2')
            p Choose 'ALEXA' from the toolbar
            p choose the 'Get Started' button for 'Alexa Skills Kit'      
            p Choose 'Add a New Skill'
            v-btn(@click="step++") next
            v-btn(@click="step--") back
          v-stepper-content(step='3')
            p Create a new skill using the following information:
            ol
              li Skill Name:`QnA Bot`
              li Invocation Name:`q and a`
              li Intent Schema: 
                v-btn copy to clipboard
              li Custom Slot Type:`EXAMPLE_QUESTIONS`  
              li Sample Utterances:`Qna_intent {QnA_slot}`
                v-btn copy to clipboard
              li Endpoint:Choose "AWS Lambda ARN"
              li Lambda Arn: {{$store.state.bot.lambdaArn}}
              li choose all other defaults 
            v-btn(@click="step++") next
            v-btn(@click="step--") back
          v-stepper-content(step='4')
            p 
              span go to 
              a(href="https://echosim.io/"  target="_blank") echosim.io 
              span say "alexa ask QnA"
            v-btn(@click="step--") back
      div(id="alexa" v-html="text")
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
var handlebars=require('handlebars')
var clipboard=require('clipboard')

module.exports={
  data:function(){
    var self=this
    return {
      visible:false,
      step:0,
      clipboard:new clipboard('.clip',{
        text:function(){
          return self.$store.state.bot.utterances.join('\n')
        }
      })
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
    text:function(){
      var temp=handlebars.compile(require('./alexa.md'))
      return markdown(temp(this.$store.state))
    }
    }
  ),
  created:function(){
    this.$store.dispatch('data/botinfo').catch(()=>null) 
  },
  methods:{} 
}
</script>
