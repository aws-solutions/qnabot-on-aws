<template lang="pug">
  span(class="wrapper")
    v-btn.block(
      :disabled="loading" @click="build" slot="activator" 
      flat id="lex-rebuild") Lex Rebuild
    v-dialog(
      persistent
      v-model="snackbar"
    )
      v-card(id="lex-loading")
        v-card-title(primary-title) Rebuilding  : {{status}}
        v-card-text
          v-subheader.error--text(v-if='error' id="lex-error") {{error}}
          v-subheader.success--text(v-if='success' id="lex-success") Success! 
          v-subheader.error--text(v-if='message' ) {{message}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
          v-btn(@click='cancel' flat id="lex-close") close
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
var Promise=require('bluebird')
var _=require('lodash')

module.exports={
  data:function(){
    return {
      snackbar:false,
      loading:false,
      success:false,
      error:''
    }
  },
  computed:{
    status:function(){
      return _.get(this,"$store.state.bot.status","Ready")
    },
    message:function(){
      return _.get(this,"$store.state.bot.build.message")
    }
  },
  methods:{
    cancel:function(){
      var self=this
      self.success=false
      self.snackbar=false
      this.$store.commit('clearBotBuildMessage')
    },
    build:function(){
      var self=this
      this.loading=true
      this.snackbar=true 
      this.success=false
      this.error=false
      this.$store.dispatch('data/build')
      .then(function(){
        self.success=true
      })
      .catch(e=>self.error=e)
      .then(()=>self.loading=false)
    }
  }
}
</script>

<style lang='scss' scoped>
  .refresh {
    flex:0; 
  }
</style>
