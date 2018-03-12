<template lang="pug">
  v-container(fluid)
    v-layout(column)
      v-flex
        v-container
          v-layout(row)
            v-flex(xs12)
              v-text-field(
                name="filter" 
                label="Filter items by ID prefix" 
                v-model="$store.state.data.filter"
                @input="filter"
                @keyup.enter="emit" 
                id="filter"
                clearable 
              )
            v-flex
              v-btn(@click='emit' class="ma-2 refresh" 
                :disabled="!$store.state.data.filter" 
              ) 
                span() Filter
            v-flex
              v-btn(@click='emit' class="ma-2 refresh" ) 
                span Refresh
            v-flex
              add 
    v-dialog(v-if="error")
      v-card
        v-card-title.headling Error
        v-card-text.error--text {{Error}}
        v-card-actions
          v-spacer
          v-btn.lighten-3(@click="error=''" :class="{ teal: success}" ) close
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
var _=require('lodash')

module.exports={
  data:function(){
    return {
      dialog:false,
      building:false,
      success:false,
      error:''
    }
  },
  components:{
    add:require('./add.vue'),
    delete:require('./delete.vue')
  },
  computed:{},
  methods:{
    filter:function(event){
      this.$store.state.data.filter=event || ""
      this.emit()
    },
    emit:_.debounce(function(){
      this.$emit('filter')
    },500,{leading:true,trailing:false}),
    build:function(){
      var self=this
      this.building=true
      
      this.$store.dispatch('data/build')
      .then(function(){
        self.success=true
        setTimeout(()=>self.success=false,2000)
      })
      .catch(e=>self.error=e)
      .then(()=>self.building=false)
    }
  }
}
</script>

<style lang='scss' scoped>
  .refresh {
    flex:0; 
  }
</style>
