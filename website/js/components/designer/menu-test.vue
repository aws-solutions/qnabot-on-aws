<template lang="pug">
  v-container(fluid)
    v-layout(row)
      v-flex(xs10)
        v-text-field(
          name="query" 
          label="type your question here" 
          id="query"
          v-model="query"
          clearable 
        )
    v-layout(row)
      v-flex(xs5)
        v-text-field(
          name="topic" 
          label="topic context" 
          id="topic"
          v-model="topic"
          clearable 
        )
      v-flex(xs5)
        v-btn(@click="simulate") Search
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
    simulate:function(){
      return this.$store.dispatch('data/search',{
        query:this.query,
        topic:this.topic
      })
    }
  }
}
</script>
