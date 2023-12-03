/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
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
      v-flex(xs2)
        v-select(
          label="Match on:"
          :items="['qna item questions', 'qna item answer', 'text item passage']"
          v-model="score_on"
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

const Vuex=require('vuex')
const saveAs=require('file-saver').saveAs
const Promise=require('bluebird')
const _=require('lodash')

module.exports={
  data:function(){
    return {
      query:"",
      topic:"",
      client_filter:"",
      score_on:"qna item questions"
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
        score_answer:this.score_answer,
        score_on:this.score_on
      })
    },500,{trailing:false,leading:true})
  }
}
</script>
