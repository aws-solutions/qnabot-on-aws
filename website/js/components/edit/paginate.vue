<template>
  <div id="paginate">
    
    <ul>
      <li v-for="index in pageArray" 
        v-bind:class="{active:isActive(index)}"
        v-on:click="go(index)">
        {{index}}
      </li>
    </ul>
    
    <span class="count">{{page.total}} Documents</span>
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
var range=require('range').range

module.exports={
  props:[],
  computed:{
    page:function(){
      return this.$store.state.page
    },
    pages:function(){
      return this.$store.state.page.total/this.view 
    },
    pageArray:function(){
      return range(0,this.pages-1)
    }
  },
  data:()=>({
    view:10 
  }),
  methods:{
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.$store.commit('setError',reason)
      }
    },
    isActive(index){
      return index===this.$store.state.page.current
    },
    go(index){
      var self=this
      this.$store.dispatch('page/goToPage',index)
      .catch(self.error("Could not go to page"))
    },
    first(){
      this.go(0)
    },
    next(){
      var self=this
      this.$store.dispatch('page/nextPage')
      .catch(self.error("Could not go to page"))
    },
    prev(){
      var self=this
      this.$store.dispatch('page/previousPage')
      .catch(self.error("Could not go to page"))
    },
    last(){
      this.go(this.pages-1)
    }
  } 
}
</script>
