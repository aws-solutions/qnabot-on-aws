<template lang='pug'>
  v-container(column grid-list-md id="page-import")
    v-layout(column)
      v-flex
        v-card
          v-card-title.display-1.pa-2 Import
          v-card-text
            p {{importWarning}}  
            p.title From File
            div.ml-4.mb-2
              input(
                type="file" 
                name="file"
                id="upload-file" 
                v-on:change="Getfile"
                ref="file"
              )
            p.title From url
            div.d-flex.ml-4
              v-text-field(name="url" label="Type here to import from url" id="url" clearable v-model="url")
              v-btn(@click="Geturl" 
                style="flex:0;"
                :disabled="url.length===0"
                id="import-url") import
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
                    v-btn(fab block icon @click="deleteJob(index)" :loading="job.loading") 
                      v-icon delete
                v-divider(v-if="index + 1 < jobs.length")
      v-flex
        v-expansion-panel
          v-expansion-panel-content
            p.title(slot="header" id="examples-open") Examples/Demos
            v-container(id="examples" grid-list-xl)
              v-layout(row wrap)
                v-flex(v-for="example in examples" xs12 sm6 md3)
                  v-card.elevation-1(style="min-height:150px;")
                    v-card-title
                      h3.title {{example.id}}
                    v-card-text.pa-0.pl-2
                      p {{example.text}}
                    v-card-actions.pa-0.pr-2.pb-2
                      v-spacer
                      v-btn.example(
                        @click="url=example.document.href"
                        :id="'example-'+example.id"
                      ) Load
    v-dialog(v-model="loading" persistent)
      v-card( id="import-loading")
        v-card-title Loading
        v-card-text
          span(v-if="error" class='error--text' id="import-error") Error: 
            pre {{error}} 
          span(v-if="!error & success" id="import-success") {{success}} 
          v-progress-linear( v-if="!error && !success" indeterminate)
        v-card-actions
          v-spacer
          v-btn(v-if="error || success" 
            @click='close'
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
const parseJson = require('json-parse-better-errors')

var _=require('lodash')

module.exports={
  data:function(){
    var self=this
    return {
      importWarning:"Warning, Importing will over write existing QnAs with the same ID",
      loading:false,
      testing:false,
      url:"",
      error:"",
      success:'',
      jobs:[],
      examples:[]
    }
  },
  components:{
  },
  computed:{
  },
  created:async function(){
    this.refresh()
    var examples=await this.$store.dispatch('api/listExamples')
    this.examples=examples
  },
  methods:{
    close:function(){
      this.loading=false
      this.error=false
    },
    deleteJob:function(index){
      var self=this
      console.log(this.jobs,index)
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
    addJob:function(jobId){
      var self=this
      return this.$store.dispatch('api/getImport',jobId)
      .then(result=>Object.assign(jobId,result))
      .then(job=>{
        self.jobs.splice(0,0,job)
        
        poll()
        function poll(){
          self.$store.dispatch('api/getImport',job)
          .then(function(result){
            Object.assign(job,result) 
            if(result.status==="InProgress"){
              setTimeout(()=>poll(),100)
            }
          })
        }
      })
    },
    refresh:function(index){
      var self=this
      if(index===undefined){
        self.jobs=[]
        return this.$store.dispatch('api/listImports')
        .then(result=>{
          result.jobs.forEach((job,index)=>{
            return self.addJob(job)
          })
        })
      }
    },
    Getfile:function(event){
      var self=this
      this.loading=true
      var files_raw=self.$refs.file.files
      var files=[]
      for(i=0;i<files_raw.length;i++){
        files.push(files_raw[i])
      }
      Promise.all(files.map(file=>{
        var name=file.name
        return new Promise(function(res,rej){
          var reader = new FileReader();
          reader.onload = function(e){ 
            try {
              res(parseJson(e.srcElement.result))
            } catch(e) {
              rej(e)
            }
          };
          reader.readAsText(file);
        })
      }))
      .map(data=>self.upload(data,name))
      .catch(e=>{
        console.log(e)
        self.error=e.message
      })
    },
    Geturl:function(event){
      var self=this
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
        console.log(data)
        if(data.qna.length){
          self.$store.dispatch('api/startImport',{
            qa:data.qna,
            name:id
          })
          .then(res).catch(rej)
        }else{
          rej('Invalid or Empty File')
        }
      })
      .then(()=>{
        return self.$store.dispatch('api/waitForImport',{id})
      })
      .then(job=>{
        self.success="Import Started!"
        return self.addJob(job)
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
