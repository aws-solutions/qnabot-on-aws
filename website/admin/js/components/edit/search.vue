<template>
  <div id="search">
    <div class="search-input search-bar">
      <div class="prefix">Question: </div>
      <input 
        v-model="query"
        type="text" 
        name="search"
        placeholder="Type your question here." 
        v-on:keyup.enter.stop="search">
      <spin-button
        Id='search-button'
        v-on:Click="search"
        v-bind:down="loading"
        v-bind:loading="loading"
        label="test"></spin-button>
    </div>
    <div class="search-input search-bar topic">
      <div class="prefix">Topic: </div>
      <input 
        v-model="topic"
        type="text" 
        name="topic"
        placeholder="Type your question topic here." 
        v-on:keyup.enter.stop="search">
    </div>
    <div class="error" v-show="invalid">
      <p>Please, type in a question</p>
    </div>
  </div>
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
module.exports={
  data:function(){
    return {
      query:"",
      topic:"",
      found:false,
      loading:false
    }
  },
  computed:{
    invalid:function(){
      console.log(this.$validator)
      return this.$validator.errors.has('search')
    }
  },
  components:{
    'spin-button':require('./spinner-button.vue')
  },
  methods:{
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.$store.commit('setError',reason)
      }
    },
    search:function(query){
      var self=this
      
      if(!this.invalid){
        self.loading=true
        this.$store.dispatch('search',{
          query:this.query,
          topic:this.topic
        })
        .catch(self.error('Could not perform test'))
        .finally(()=>self.loading=false)
      }
    },
  }
}
</script>
