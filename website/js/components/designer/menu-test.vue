<template lang="pug">
  v-container(fluid)
    v-layout(row)
      v-flex(xs5)
        v-text-field(
          name="query" 
          label="Type your question here" 
          id="query"
          v-model="query"
          @keyup.enter="simulate"
          clearable 
        )
      v-flex(xs5)
        v-checkbox(
          label="Score on answer field (instead of questions)"
          v-model="score_answer"
          true-value="true"
          false-value="false"
        )
    v-layout(row)
      v-flex(xs5)
        v-text-field(
          name="topic" 
          label="(optional) Topic context" 
          id="topic"
          v-model="topic"
          @keyup.enter="simulate"
          clearable 
        )
      v-flex(xs5)
        v-btn(@click="simulate" id="query-test") Search
    v-layout(row)
      v-flex(xs5)
        v-text-field(
          name="client_filter" 
          label="(optional) Client filter context" 
          id="client_filter"
          v-model="client_filter"
          @keyup.enter="simulate"
          clearable 
        )
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
      topic:"",
      client_filter:"",
      score_answer:"false"
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
        client_filter:this.client_filter,
        score_answer:this.score_answer
      })
    },500,{trailing:false,leading:true})
  }
}
</script>
