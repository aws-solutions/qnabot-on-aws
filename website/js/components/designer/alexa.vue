<template lang="pug">
  v-dialog(v-model='dialog' persistent max-width='50%')
    template
      v-btn.block(flat slot="activator") Alexa Update
    v-card(id="alexa-modal")
      v-card-title(primary-title)
        .headline Re-configure Alexa
      v-card-text
        p You only need to update the schema of your alexa skill.
      v-card-actions
        v-btn( :loading="loading"
          v-if="!ready" 
          @click="download"
        ) Copy Schema
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
        v-btn(@click='dialog = false') Close
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
    this.$store.dispatch('data/botinfo').catch((err)=>console.log('error while obtaining botinfo: ' + err));
  },
  methods:{
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

