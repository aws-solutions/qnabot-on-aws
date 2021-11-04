<template lang='pug'>
  v-card(flat class="pa-0")
    span(v-show="false" :data-path="data.qid+'-.qid'") {{data.qid}}
    display(
      :schema="schema"
      :path='data.qid+"-"'
      row
      v-model="topitems"
    )
    v-divider(v-if="extra")
    display(
      v-if="extra"
      :schema="schema"
      :path='data.qid+"-"'
      column
      v-model="bottomitems"
    )
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
var Promise=require('bluebird')
var _=require('lodash')
module.exports={
  props:['data'],
  data:()=>{return {
    advanced:false,
    top:["q","a"]
  }},
  components:{
    display:require('./display.vue').default
  },
  computed:{
    type:function(){
      return this.data.type || 'qna'
    },
    schema:function(){
      return this.$store.state.data.schema[this.type]
    },
    extra:function(){
      return _.values(_.pick(this.items,this.top)).length>0
    },
    items:function(){
      return _.omit(this.data,['qid'])
    },
    topitems:function(){
      if(this.type==='qna'){
        return _.pick(this.items,this.top)
      }else{
        return this.items
      }
    },
    bottomitems:function(){
      if(this.type==='qna'){
        return _.omit(this.items,this.top)
      }else{
        return {}
      }
    }
  },
  methods:{}
}
</script>

<style lang='scss' scoped>
  ul {
    list-style:none;
  }
</style>
