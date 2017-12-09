<template lang="pug">
  v-container(fluid)
    v-layout(row)
      v-flex(xs6)
        v-text-field(
          name="filter" 
          label="Filter items by ID prefix" 
          v-model="$store.state.data.filter"
          @input="filter"
          id="filter"
          clearable 
        )
      v-flex(xs6)
        v-btn(@click='emit') 
          span(v-if="$store.state.data.filter.length===0") Refresh
          span(v-if="$store.state.data.filter.length!==0") Filter
        add
        delete
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
      dialog:false 
    }
  },
  components:{
    add:require('./add.vue'),
    delete:require('./delete.vue')
  },
  computed:{},
  methods:{
    filter:function(event){
      this.$store.state.data.filter=event|| ""
    },
    emit:function(){
      this.$emit('filter')
    }
  }
}
</script>
