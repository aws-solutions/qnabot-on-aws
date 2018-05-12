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
          v-if="!ready" 
          @click="download"
        ) download Schema
        v-btn( :loading="loading"
          v-if="ready"
          @click="copy"
          v-clipboard:copy="text"
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
var Promise=require('bluebird')

module.exports={
  data:function(){
    var self=this
    return {
      dialog:false,
      loading:false,
      text:false,
      ready:false
    }
  },
  components:{
  },
  computed:{
    
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
    download:async function(){
      this.loading=true
      await this.$store.dispatch('data/botinfo')
      this.text=JSON.stringify(this.$store.state.bot.alexa,null,2)
      this.ready=true
      this.loading=false
    },
    copy:async function(){
      this.loading=true
      await Promise.delay(1000)
      this.ready=false
      this.loading=false
    }
  }
}
</script>

<style lang='scss' scoped>
</style>

