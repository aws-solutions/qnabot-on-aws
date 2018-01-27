<template lang='pug'>
  v-container(column grid-list-md)
    v-layout(column)
      v-flex
        v-card
          v-card-title.display-1.pa-2 Export
          v-card-text 
            v-text-field(name="filename" 
              label="filename" 
              id="filename" clearable v-model="filtername")
            v-text-field(name="filter" 
              label="(optional) filter export by qid prefix" 
              id="filter" clearable v-model="filter")
          v-card-actions
            v-spacer
            v-btn(@click="download(filtername)" id="export") export
    v-dialog(v-model="loading" persistent id="export-loading")
      v-card
        v-card-title Loading
        v-card-text
          span(v-if="error" class='error--text') Error: {{error}} 
          span(v-if="success") {{success}} 
          v-progress-linear( v-if="!error && !success" indeterminate)
        v-card-actions
          v-spacer
          v-btn(v-if="error || success" @click='loading=false') close
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
var saveAs=require('file-saver').saveAs
var axios=require('axios')
var _=require('lodash')

module.exports={
  data:function(){
    var self=this
    return {
      loading:false,
      error:"",
      success:'',
      filter:"",
      filename:{
        all:'qna.json',
        filter:"qna",
        prefix:"qna",
        tmp:""
      }
    }
  },
  computed:{
    filtername:{
      get:function(){
        if(this.filter){
          return this.filename.prefix+'-'+this.filter+'.json'
        }else{
          return this.filename.prefix+'.json'
        }
      },
      set:function(val){
        this.tmp=val
      }
    }
  },
  components:{
  },
  
  methods:{
    download:function(filename){
      var self=this
      this.loading=true
      this.$store.dispatch('api/list',{
        perpage:'1000',
        filter:this.filter
      })
      .then(function(result){
        var blob = new Blob(
          [JSON.stringify({
            qna:result.qa.map(x=>_.pickBy(_.omit(x,['_score'])))
          },null,3)], 
          {type: "text/plain;charset=utf-8"}
        );
        var name=filename || 'qna'
        return Promise.resolve(saveAs(blob,name))
      })
      .then(()=>self.loading=false)
      .catch(err=>this.error=err)
    }
  }
}
</script>
