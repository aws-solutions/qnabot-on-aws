<template lang="pug">
  v-container(fluid)
    v-layout(row)
      v-flex(xs10)
        v-text-field(
          name="query" 
          label="type your question here" 
          id="query"
          v-model="query"
          @keyup.enter="simulate"
          clearable 
        )
    v-layout(row)
      v-flex(xs5)
        v-text-field(
          name="topic" 
          label="topic context" 
          id="topic"
          v-model="topic"
          @keyup.enter="simulate"
          clearable 
        )
      v-flex(xs5)
        v-btn(@click="simulate" id="query-test") Search
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')
var _=require('lodash')

module.exports={
  data:function(){
    return {
      query:"",
      topic:""
    }
  },
  components:{
  },
  computed:{},
  methods:{
    simulate:_.debounce(function(){
      return this.$store.dispatch('data/search',{
        query:this.query,
        topic:this.topic,
      })
    },500,{trailing:false,leading:true})
  }
}
</script>
