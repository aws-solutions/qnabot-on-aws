<template>
  <div id="paginate">
    <i class="fa fa-angle-double-left" aria-hidden="true" v-on:click="first"></i>
    <i class="fa fa-angle-left" aria-hidden="true" v-on:click="prev"></i>
    <span v-show="this.page.current > this.view/2" >...</span>
    <ul>
      <li v-for="index in pageArray" 
        v-bind:class="{active:isActive(index)}"
        v-on:click="go(index)">
        {{index}}
      </li>
    </ul>
    <span v-show="this.pages-this.page.current > this.view/2+1" >...</span>
    <i class="fa fa-angle-right" aria-hidden="true" v-on:click="next"></i>
    <i class="fa fa-angle-double-right" aria-hidden="true" v-on:click="last"></i>
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
  computed:Object.assign(
    Vuex.mapState([
        'QAs',"page"
    ]),
    {
    pages:function(){
      return this.$store.getters['user/pages']
    },
    pageArray:function(){
      var page=this.$store.state.page.current
      if(this.pages<this.view){
        return range(0,this.pages)
      }else{
        return range(Math.max(0,page-this.view/2),Math.min(this.pages,page+this.view/2+1))
      }
    }}
  ),
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
      this.$store.dispatch('goToPage',index)
      .catch(self.error("Could not go to page"))
    },
    first(){
      this.go(0)
    },
    next(){
      var self=this
      this.$store.dispatch('nextPage')
      .catch(self.error("Could not go to page"))
    },
    prev(){
      var self=this
      this.$store.dispatch('previousPage')
      .catch(self.error("Could not go to page"))
    },
    last(){
      this.go(this.pages-1)
    }
  } 
}
</script>
