<template lang='pug'>
  v-container(column grid-list-md)
    v-layout(row)
      v-flex
        v-card
          v-card-title.headline Import
          v-card-text
            v-text-field(name="url" label="Type here to import from url" id="url" clearable v-model="url")
          v-card-actions
            v-spacer
            v-btn(@click="dialog=true" v-if="url.length>0") from url
            v-btn(@click="dialog=true" v-if="url.length===0") from file
      v-flex
        v-card
          v-card-title.headline Export
          v-card-text 
            v-text-field(name="filter" label="filter export by qid prefix" id="filter" clearable v-model="filter")
            v-text-field(name="filename" label="filename" id="filename" clearable v-model="filename")
          v-card-actions
            v-spacer
            v-btn(@click="download") export
    v-dialog(v-model="loading" persistent)
      v-card
        v-card-title Loading
        v-card-text
          span(v-if="error" class='error--text') Error: {{error}} 
          span(v-if="success") {{success}} 
          v-progress-linear( v-if="!error && !success" indeterminate)
        v-card-actions
          v-spacer
          v-btn(v-if="error || success" @click='loading=false') close
    v-dialog(v-model="dialog")
      v-card
        v-card-title Confirm
        v-card-text 
          span(v-if="url.length>0") are you sure you want to import from {{url}}?
          span(v-if="url.length===0") are you sure you want to import?
        v-card-actions
          v-spacer
          span(v-if="url.length>0")
            v-btn(@click="dialog=false" flat ) cancel
            v-btn(@click="upload('url')" flat ) continue
          span(v-if="url.length===0")
            input(type="file" 
                ref="file"
                id="file"
                style="display:none;" 
                v-on:change="upload('file')")
            v-btn(@click="dialog=false" flat ) cancel
            v-btn(@click="$refs.file.click()" flat ) continue
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

module.exports={
  data:function(){
    return {
      dialog:false,
      loading:false,
      url:"",
      error:"",
      success:'',
      filter:"",
      filename:"qna.json"
    }
  },
  components:{
  },
  methods:{
    download:function(){
      var self=this
      this.loading=true
      this.$store.dispatch('api/list',{
        perpage:'all',
        filter:this.filter
      })
      .then(function(result){
        var blob = new Blob(
          [JSON.stringify({qna:result.qa},null,3)], 
          {type: "text/plain;charset=utf-8"}
        );
        return Promise.resolve(saveAs(blob,self.filename || "qna.json"))
      })
      .then(()=>self.loading=false)
    },
    upload:function(event){
      var self=this
      this.dialog=false
      this.loading=true
      new Promise(function(res,rej){
        if(event==='file'){
          console.log(self.$refs)
          var reader = new FileReader();
          reader.onload = function(e) { 
            try {
              res(JSON.parse(e.srcElement.result))
            } catch(e) {
              rej("invalid JSON")
            }
          };
          reader.readAsText(self.$refs.file.files[0]);
        }else if(event==='url'){
          Promise.resolve(axios.get(self.url))
          .then(x=>res(x.data))
          .catch(x=>rej({
            status:x.response.status,
            message:x.response.data
          }))
        }else{
          rej('error: invalid type')
        }
      })
      .then(function(data){
        console.log(data)
        if(data.qna){
          return self.$store.dispatch('api/bulk',data)
        }else{
          return Promise.reject('Invalid File')
        }
      })
      .then(()=>self.success="success!")
      .catch(error=>self.error=error)
    }
  }
}
</script>
