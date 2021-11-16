<template lang="pug">
  span(class="wrapper")
    v-dialog(v-model="loading" persistent id="delete-loading")
      v-card
        v-card-title(primary-title) Deleting 
        v-card-text(v-if="!selectAll")
          ul
            li(v-for="id in ids") {{id}}
        v-card-text
          v-subheader.error--text(v-if='error' id="delete-error") {{error}}
          v-subheader.success--text(v-if='success' id="delete-success") {{success}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
            v-btn(@click='cancel' flat) close
    v-dialog(persistent v-model='dialog' max-width='50%')
      v-btn(slot="activator" block  icon) 
        v-icon delete
      v-card
        v-card-title(primary-title)
          .headline Delete Selection
        v-card-text
          span(v-if="!selectAll")
            p Are you sure you want to delete the following QnAs:
            ul
              li(v-for="qa in QAs") {{qa.qid}}
          span(v-if="selectAll && !filter")
             p Are you sure you want to delete all QnAs
          span(v-if="selectAll && filter")
             p Are you sure you want to delete all QnAs with prefix: 
             p {{filter}} 
        v-card-actions
          v-spacer
          v-btn(@click='cancel') Cancel
          v-btn(@click='rm' id="confirm-delete") Delete
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')
var _=require('lodash')
module.exports={
  props:['data','selectAll','selected'],
  data:function(){
    return {
      error:'',
      success:'',
      dialog:false,
      loading:false,
      total:0,
      progress:0,
      ids:[]
    }
  },
  components:{
  },
  computed:{
    QAs:function(){
      return this.data ? [this.data] : this.$store.state.data.QAs.filter(x=>x.select)
    },
    filter:function(){
      return this.$store.state.data.filter
    }
  },
  methods:{
    cancel:function(){
      this.dialog=false
      this.loading=false
      this.error=false
    },
    rm:function(){
      var self=this
      self.loading=true
      this.ids=this.QAs.map(x=>x.qid)
      self.dialog=false
      return Promise.try(function(){
        if(self.selectAll){
          return self.$store
            .dispatch('data/removeFilter') 
            .then(()=>self.selectAll=false)
        } else { 
          self.total=self.QAs.length
          return Promise.try(function(){
              if(self.QAs.length===1){
                return self.$store.dispatch('data/removeQA',self.QAs[0])
              }else{
                return self.$store.dispatch('data/removeQAs',self.QAs)
              }
          })
        }
      })
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

