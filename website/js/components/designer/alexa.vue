<template lang="pug">
  v-dialog(v-model='dialog' max-width='50%')
    v-btn.block(flat slot="activator" @click='open') Alexa Update
    v-card(id="alexa-modal")
      v-card-title(primary-title)
        .headline Re-configure Alexa
      v-card-text
        p You only need to update the schema of your alexa skill.
      v-card-actions
        v-btn( :loading="loading"
          v-clipboard:copy="text"
          @click="copy"
        ) Copy Schema
        input(style="display:none"
          type="text"
          :value="text"
          id="alexa-schema"
        )
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

module.exports={
  data:function(){
    var self=this
    return {
      dialog:false,
      loading:false
    }
  },
  components:{
  },
  computed:{
    text:function(){
      console.log(this.$store.state.bot)
      return JSON.stringify(this.$store.state.bot.alexa,null,2)
    }
  },
  created:function(){
    this.$store.dispatch('data/botinfo').catch(()=>null) 
  },
  methods:{
    close:function(){
      this.dialog=false
    },
    open:function(){
      this.dialog=true
    },
    copy:async function(){
      this.loading=true
      await this.$store.dispatch('data/botinfo')
      await this.$copyText(this.text).catch(console.log)
      this.loading=false
    }
  }
}
</script>

<style lang='scss' scoped>
</style>

