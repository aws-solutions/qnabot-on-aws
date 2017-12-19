<template lang="pug">
  span(class="wrapper")
    v-btn.block(:disabled="loading" @click="build" slot="activator" flat ) Lex Rebuild
    v-dialog(
      persistent
      v-model="snackbar"
    )
      v-card
        v-card-title(primary-title) Rebuilding 
        v-card-text
          v-subheader.error--text(v-if='error') {{error}}
          v-subheader.success--text(v-if='success') {{success}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
          v-btn(@click='cancel' flat) close
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
    return {
      snackbar:false,
      loading:false,
      success:false,
      error:''
    }
  },
  computed:{},
  methods:{
    cancel:function(){
      var self=this
      self.success=false
      self.snackbar=false
    },
    build:function(){
      var self=this
      this.loading=true
      this.snackbar=true 
      this.$store.dispatch('data/build')
      .then(function(){
        self.success=true
        setTimeout(()=>self.cancel(),2000)
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
