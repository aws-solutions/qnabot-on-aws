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
