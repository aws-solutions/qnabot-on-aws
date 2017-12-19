<template lang="pug">
  v-dialog(v-model='dialog' max-width='50%')
    v-btn.block(flat slot="activator" @click='open') Alexa Update
    v-card
      v-card-title(primary-title)
        .headline Re-configure Alexa
      v-card-text
        p You only need to update the utterances of your alexa skill.
      v-card-actions
        v-btn#utterances( :loading="loading" @click="copy()") Copy Utterances       
      v-card-actions
        v-spacer
        v-btn(@click='close') Close
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
var _=require('lodash')
var clipboard=require('clipboard')

module.exports={
  $validates:true,
  data:function(){
    var self=this
    return {
      dialog:false,
      loading:false,
      utterances:new clipboard('#Utterances',{
        text:function(){
          return self.$store.state.bot.utterances.join('\n')
        }
      })
    }
  },
  components:{
    "schema-input":require('./input.vue')
  },
  computed:{
    schema:function(){
      return this.$store.state.data.schema
    }
  },
  methods:{
    close:function(){
      this.dialog=false
    },
    open:function(){
      this.dialog=true
    },
    copy:function(btn){
      this.loading=true
      setTimeout(()=>this.loading=false,1000)
    }
  }
}
</script>

<style lang='scss' scoped>
</style>

