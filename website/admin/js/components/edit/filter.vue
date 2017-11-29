<template>
  <div id="filter">
    <div class="filter-input search-bar">
      <div class="prefix">Filter: </div>
      <div class="input-container">
        <input 
          v-model="query"
          type="text" 
          name="filter"
          placeholder="Filter items by ID prefix" 
          v-on:keyup.enter.stop="search">
          <icon name="times" v-on:click.native="refresh"></icon>
      </div>
      <spin-button
        Id='filter-button'
        v-on:Click="search"
        v-bind:down="searching"
        v-bind:loading="searching"
        label="Load"></spin-button>
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
      visible:false,
      searching:false
    }
  },
  components:{
    'spin-button':require('./spinner-button.vue')
  },
  computed:{
    invalid:function(){
      return this.$validator.errors.has('filter')
    }
  },
  methods:{
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.$store.commit('setError',reason)
      }
    },
    refresh:function(){
      var self=this
      self.query=""
      self.$store.commit('data/clearQA')
      self.$store.commit('data/clearFilter')
      return self.$store.dispatch('data/get',0)
      .catch(self.error('failed to refresh'))
    },   
    search:function(){
      var self=this

      if(!this.invalid){
        self.searching=true
        if(self.query){
          self.$store.commit('data/setFilter',self.query+'.*')
          self.$store.commit('data/clearQA')
          
          return self.$store.dispatch('data/get',0)
          .catch(self.error('failed to search'))
          .finally(()=>self.searching=false)
        }else{
          return self.refresh()
          .finally(()=>self.searching=false)
        }
      }
    }
  } 
}
</script>
