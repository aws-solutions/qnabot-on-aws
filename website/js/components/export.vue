<template lang='pug'>
  v-container(column grid-list-md)
    v-layout(column)
      v-flex
        v-card
          v-card-title.display-1.pa-2 Export
          v-card-text 
            v-text-field(name="filename" 
              label="filename" 
              id="filename" clearable v-model="filename")
            v-text-field(name="filter" 
              label="(optional) filter export by qid prefix" 
              id="filter" clearable v-model="filter")
          v-card-actions
            v-spacer
            v-btn(@click="start()" id="export") export
      v-flex(v-if="exports.length>0")
        v-card(id="export-jobs")
          v-card-title.headline Exports
          v-card-text
            v-list
              template(v-for="(job,index) in exports")
                v-list-tile(:id="'export-job-'+job.id" :data-status="job.status")
                  v-list-tile-content.job-content
                    v-list-tile-title {{job.id}}: {{job.status}}
                    v-list-tile-sub-title
                      v-progress-linear(v-model="job.progress*100")
                  v-list-tile-action.job-actions(
                    style="flex-direction:row;"
                  )
                    v-btn(fab block icon @click="remove(index)") 
                      v-icon delete
                    v-btn(fab block 
                      v-show="job.status==='Completed'"
                      icon @click="download(index)" :loading="job.loading") 
                      v-icon file_download

                v-divider(v-if="index + 1 < exports.length")
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
      filename:"qna.json",
      exports:[]
    }
  },
  computed:{
  },
  components:{},
  created:async function(){
    this.refresh() 
  },
  methods:{
    refresh:async function(){
      var self=this
      var exports=await this.$store.dispatch('api/listExports')
      this.exports=exports.jobs
      this.exports.map(async (job,index,coll)=>{
        var info=await this.$store.dispatch('api/getExport',job)
        var out={}
        Object.assign(out,coll[index],info)
        coll.splice(index,1,out)
        poll()
        async function poll(){
          var status=await self.$store.dispatch('api/getExport',job)
          Object.assign(out,coll[index],status)
          console.log(status.status)
          if(status.status!=="Completed" && status.status!=="Error"){
            setTimeout(()=>poll(),1000)
          }
        }
      })
    },
    start:async function(){
      var self=this
      try{
        await this.$store.dispatch('api/startExport',{
          name:this.filename,
          filter:this.filter
        })
        await this.refresh()
      }catch(e){
        this.error=err
      }finally{
      }
    },
    remove:async function(index){
      await this.$store.dispatch('api/deleteExport',this.exports[index])
      await this.refresh()
    },
    download:async function(index){
      var raw=await this.$store.dispatch('api/downloadExport',this.exports[index])
      var blob = new Blob(
        [JSON.stringify(JSON.parse(raw),null,2)], 
        {type: "text/plain;charset=utf-8"}
      );
      var name=this.exports[index].id
      return Promise.resolve(saveAs(blob,name))
    }
  }
}
</script>
