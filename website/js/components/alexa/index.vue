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
                    v-container
                      v-layout(row)
                        v-flex(xs1)
                          v-btn(
                            @click="stepNumber--" v-if="index>0" 
                            style="height:100%"
                            left) 
                            v-icon keyboard_arrow_left
                        v-flex(xs10)
                          v-container
                            v-layout(column)
                              v-flex(xs12)
                                v-card-text
                                  .headline.text-xs-center {{step.title}}
                                  span(v-html="step.text")
                                v-card-actions
                                  v-btn(v-for="(y,x) in step.buttons"
                                    :id="y.id"
                                    :key="x"
                                    :loading="y.loading"
                                    @click="copy(y)") {{y.text}}

                              v-flex(xs12)
                                img(
                                  :src="step.image"
                                  style="max-width:75%;display:block;margin:auto;"
                                  contain
                                  v-if="step.image"
                                )
                        v-flex(xs1)
                          v-btn(
                            @click="stepNumber++" v-if="index+1<steps.length"
                            style="height:100%"
                            right) 
                            v-icon keyboard_arrow_right
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
renderer.table=function(header,body){
  return `<table class="pure-table"><thead>${header}</thead><tbody>${body}</tbody></table>`
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
      schema:new clipboard('#Schema',{
        text:function(){
          return JSON.stringify(self.$store.state.bot.alexa,null,2)
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
    {
    steps:function(){
      var self=this
      return _.map(this.stepsRaw,function(x){ 
        var y=Object.assign({},x)
        if(x.text){
          var temp=handlebars.compile(x.text)
          y.text=markdown(temp(self.$store.state.bot),{renderer})
        }
        return y
      })
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
