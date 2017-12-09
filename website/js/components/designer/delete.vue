<template lang="pug">
  span(class="wrapper")
    v-dialog(v-model="loading" persistent)
      v-card
        v-card-title(primary-title) Deleting 
        v-card-text
          ul
            li(v-for="qa in QAs") {{qa.qid}}
          v-subheader.error--text(v-if='error') {{error}}
          v-subheader.success--text(v-if='success') {{success}}
          v-progress-linear(v-if='!error && !success' v-model='progress')
        v-card-actions
          v-spacer
            v-btn(@click='cancel' flat) close
    v-dialog(persistent v-model='dialog' max-width='50%')
      v-btn(slot="activator" block  :disabled="!(icon || show)" :icon="icon") 
        span(v-if="!icon") Delete All
        v-icon(v-if="icon") delete
      v-card
        v-card-title(primary-title)
          .headline Delete Selection
        v-card-text
          p Are you sure you want to delete the following:
          ul
            li(v-for="qa in QAs") {{qa.qid}}
        v-card-actions
          v-spacer
          v-btn(@click='cancel') Cancel
          v-btn(@click='rm') Delete
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
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')
var _=require('lodash')
module.exports={
  props:['data','icon'],
  data:function(){
    return {
      error:'',
      success:'',
      dialog:false,
      loading:false,
      total:0,
      progress:0
    }
  },
  components:{
  },
  computed:{
    QAs:function(){
      return this.data ? [this.data] : this.$store.state.data.QAs.filter(x=>x.select)
    },
    show:function(){
      return this.QAs.length>1
    }
  },
  methods:{
    cancel:function(){
      this.dialog=false
      this.loading=false
    },
    rm:function(){
      var self=this
      self.loading=true
      self.dialog=false
      self.total=self.QAs.length
      self.progress=0
      Promise.all(
        this.QAs.map(x=>
          self.$store.dispatch('data/removeQA',x)
            .tap(()=>self.progress+=(100/self.total))
        )
      ) 
      .tap(()=>self.$store.commit('data/selectAll',false))
      .tap(()=>self.success='Success!')
      .catch(error=>self.error=error)
    }
  }
}
</script>

<style lang='scss' scoped>
  .wrapper {
    display:inline-block;
  }
</style>

