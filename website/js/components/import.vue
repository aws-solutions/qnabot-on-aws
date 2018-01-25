<template lang='pug'>
  v-container(column grid-list-md id="page-import")
    v-layout(column)
      v-flex
        v-card
          v-card-title.headline Import From File
          v-card-text(v-if="dialog.file")
            p {{importWarning}}  
            input(
              type="file" 
              name="file"
              id="upload-file" 
              v-on:change="Getfile"
              ref="file"
            )
          v-card-actions
            v-spacer
            v-btn(@click="dialog.file=true" 
              id="choose-file"
              v-if="!dialog.file"
            ) Start
            v-btn(@click="dialog.file=false"
              v-if="dialog.file"
            ) Cancel
      v-flex
        v-card
          v-card-title.headline Import From Url
          v-card-text(v-if="!dialog.url")
            v-text-field(name="url" label="Type here to import from url" id="url" clearable v-model="url")
          v-card-text(v-if="dialog.url")
            p Warning, This will over write existing QnAs
          v-card-actions(v-if="!dialog.url")
            v-spacer
            v-btn(@click="dialog.url=true" id="import-url" 
              :disabled="!url || url.length===0") Start
          v-card-actions(v-if="dialog.url")
            v-spacer
            v-btn(@click="dialog.url=false") cancel
            v-btn(@click="Geturl" id="confirm-import-url") continue
      v-flex(v-if="jobs.length>0")
        v-card(id="import-jobs")
          v-card-title.headline Import Jobs
          v-card-text
            v-list
              template(v-for="(job,index) in jobs")
                v-list-tile(:id="'import-job-'+job.id" :data-status="job.status")
                  v-list-tile-content.job-content
                    v-list-tile-title {{job.id}}: {{job.status}}
                    v-list-tile-sub-title
                      v-progress-linear(v-model="job.progress*100")
                  v-list-tile-action.job-actions
                    v-btn(fab block icon @click="refresh(index)" :loading="job.refreshing") 
                      v-icon refresh
                    v-btn(fab block icon @click="deleteJob(index)" :loading="job.loading") 
                      v-icon delete
                v-divider(v-if="index + 1 < jobs.length")
          v-card-actions
            v-spacer
            v-btn(@click="refresh()" id="import-job-refresh") refresh
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
      importWarning:"Warning, This will over write existing QnAs with the same ID",
      dialog:{
        file:false,
        url:false
      },
      loading:false,
      testing:false,
      url:"",
      error:"",
      success:'',
      jobs:[]
    }
  },
  components:{
  },
  created:function(){
    this.refresh()
  },
  methods:{
    deleteJob:function(index){
      var self=this
      var job=this.jobs[index]
      job.loading=true
      this.$store.dispatch('api/deleteImport',job)
      .then(()=>{
        self.jobs.splice(index,1)
      })
      .catch(()=>{
        job.loading=false
      })
    },
    refresh:function(index){
      var self=this
      if(index===undefined){
        self.jobs=[]
        this.$store.dispatch('api/listImports')
        .then(result=>{
          result.jobs.forEach((job,index)=>{
            self.$store.dispatch('api/getImport',job)
            .then(x=>self.jobs.push(Object.assign(job,x)))
          })
        })
      }else{
        this.jobs[index].refreshing=true
        this.$store.dispatch('api/getImport',this.jobs[index])
        .then(result=>self.jobs.$set(index,Object.assign(self.jobs[index],result)))
        .finally(()=>self.jobs[index].refreshing=false)
      }
    },
    Getfile:function(event){
      var self=this
      this.dialog.file=false
      this.loading=true
      var files_raw=self.$refs.file.files
      var files=[]
      for(i=0;i<files_raw.length;i++){
        files.push(files_raw[i])
      }
      files.forEach(file=>{
        var name=file.name
        new Promise(function(res,rej){
          var reader = new FileReader();
          reader.onload = function(e){ 
            try {
              res(JSON.parse(e.srcElement.result))
            } catch(e) {
              console.log(e)
              rej("invalid JSON:"+e)
            }
          };
          reader.readAsText(file);
        })
        .then(data=>self.upload(data,name))
      })
    },
    Geturl:function(event){
      var self=this
      this.dialog.url=false
      this.loading=true

      Promise.resolve(axios.get(self.url))
      .then(x=>x.data)
      .tapCatch(x=>self.error=JSON.stringify({
        status:x.response.status,
        message:x.response.data
      }))
      .then(data=>self.upload(data,"url-import"))
    },
    upload:function(data,name="import"){
      var self=this
      var id=name.replace(' ' ,'-')
      new Promise(function(res,rej){
        if(data.qna){
          self.$store.dispatch('api/startImport',{
            qa:data.qna,
            name:id
          })
          .then(res).catch(rej)
        }else{
          rej('Invalid File')
        }
      })
      .then(()=>{
        return self.$store.dispatch('api/waitForImport',{id})
      })
      .then(()=>{
        self.success="success!"
        self.refresh()
      })
      .tapCatch(console.log)
      .catch(error=>self.error=error)
    },
  }
}
</script>

<style lang='scss' scoped>
  .job-content {
    flex:1;
  }

  .job-actions {
    flex:0;
    flex-direction:row;
  }
</style>
