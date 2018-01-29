<template lang='pug'>
  v-card(flat class="pa-0")
    display(
      :schema="$store.state.data.schema",
      :path:'data.qid+"-"'
      row
      v-model="topitems"
    )
    v-divider(v-if="extra")
    display(
      v-if="extra"
      :schema="$store.state.data.schema",
      :path:'data.qid+"-"'
      column
      v-model="bottomitems"
    )
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
var _=require('lodash')
module.exports={
  props:['data'],
  data:()=>{return {
    advanced:false,
    top:["q","a"]
  }},
  components:{
    display:require('./display.vue')
  },
  computed:{
    extra:function(){
      return _.values(_.pick(this.items,this.top)).length>0
    },
    items:function(){
      return _.omit(this.data,['qid'])
    },
    topitems:function(){
      return _.pick(this.items,this.top)
    },
    bottomitems:function(){
      return _.omit(this.items,this.top)
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
