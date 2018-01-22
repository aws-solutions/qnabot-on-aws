<template lang='pug'>
  v-container(column grid-list-md id="page-import")
    v-layout(column)
      v-flex
        v-card
          v-card-title.headline Import From File
          v-card-text(v-if="dialog.file")
            p Warning, This will over write existing QnAs 
          v-card-actions(v-if="!dialog.file")
            v-spacer
            v-btn(@click="dialog.file=true" id="choose-file") choose file
          v-card-actions(v-if="dialog.file")
            v-spacer
            input(
              type="file" 
              name="file"
              id="upload-file" 
              v-on:change="Getfile"
              ref="file"
            )
            v-btn(@click="dialog.file=false") cancel
      v-flex
        v-card
          v-card-title.headline Import From Url
          v-card-text(v-if="!dialog.url")
            v-text-field(name="url" label="Type here to import from url" id="url" clearable v-model="url")
          v-card-text(v-if="dialog.url")
            p Warning, This will over write existing QnAs
          v-card-actions(v-if="!dialog.url")
            v-spacer
            v-btn(@click="dialog.url=true") from url
          v-card-actions(v-if="dialog.url")
            v-spacer
            v-btn(@click="dialog.url=false") cancel
            v-btn(@click="Geturl") continue
    v-dialog(v-model="loading" persistent)
      v-card( id="import-loading")
        v-card-title Loading
        v-card-text
          span(v-if="error" class='error--text' id="import-error") Error: {{error}} 
          span(v-if="success" id="import-success") {{success}} 
          v-progress-linear( v-if="!error && !success" indeterminate)
        v-card-actions
          v-spacer
          v-btn(v-if="error || success" @click='loading=false'
            id="import-close" 
          ) close
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
      dialog:{
        file:false,
        url:false
      },
      loading:false,
      testing:false,
      url:"",
      error:"",
      success:''
    }
  },
  components:{
  },
  methods:{
    Getfile:function(event){
      var self=this
      this.dialog.file=false
      this.loading=true
      var reader = new FileReader();
      new Promise(function(res,rej){
        reader.onload = function(e){ 
          try {
            res(JSON.parse(e.srcElement.result))
          } catch(e) {
            console.log(e)
            rej("invalid JSON:"+e)
          }
        };
        reader.readAsText(self.$refs.file.files[0]);
      })
      .then(data=>self.upload(data))
    },
    Geturl:function(event){
      var self=this
      this.dialog.url=false
      this.loading=true

      Promise.resolve(axios.get(self.url))
      .then(x=>x.data)
      .catch(x=>{return {
        status:x.response.status,
        message:x.response.data
      }})
      .then(data=>self.upload(data))
    },
    upload:function(data){
      var self=this
      new Promise(function(res,rej){
        if(data.qna){
          self.$store.dispatch('api/bulk',data)
          .then(res).catch(rej)
        }else{
          rej('Invalid File')
        }
      })
      .then(()=>self.success="success!")
      .tapCatch(console.log)
      .catch(error=>self.error=error)
    },
  }
}
</script>
