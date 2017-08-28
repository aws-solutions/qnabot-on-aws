<template>
  <li ><div class="QA close labels">
    <div class="label label-Id">Id</div>
    <div class="label label-first">First Question</div>
    <div class="label label-score"> 
      <trash 
        v-on:delete="rm"
        v-show="$store.state.selectIds.length > 1 "
        v-bind:loading="deleting"
        tooltip="Delete Selected"
      ></trash>
      <span v-show="$store.state.mode==='test'">Score</span>
    </div>
  </div></li>
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
var Promise=require('bluebird')

module.exports={
  data:function(){
    return {
      deleting:false
    }
  },
  components:{
    "trash":require('./trash.vue')
  },
  computed:Object.assign({},
    Vuex.mapState([
    ]),
    Vuex.mapGetters([
    ])
  ),
  methods:{
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.$store.commit('setError',reason)
      }
    },
    rm:function(){
      var self=this
      self.deleting=true
      return this.$store.dispatch('deleteSelected') 
        .then(()=>self.$store.commit('unselectAll'))
        .catch(this.error('Unable to Delete Selected'))
        .finally(()=>self.deleting=false)
    } 
  }
}
</script>
