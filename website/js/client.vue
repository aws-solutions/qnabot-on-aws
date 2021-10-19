<template lang='pug'>
  div(id="qna-client")
    v-toolbar(color="cyan" v-if="$store.state.username")
      v-toolbar-title {{title}}
      v-spacer
      v-toolbar-items
        v-btn(flat :href="$store.state.Login" 
          v-if="$store.state.Login && $store.state.username") LogOut
    lex-web-ui
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

require("babel-polyfill");
var Vuex=require('vuex')

module.exports={
  data:()=>{return {}},
  components:{},
  computed:{
    title:function(){
      var name=this.$store.state.Username
      return name ? 'QnABot: '+name : "QnABot"
    }
  },
  methods:{}
}
</script>

<style lang='scss'>
  #lex-web > nav {
    display:none;
  }
  nav {
    z-index:1;
  }
</style>
