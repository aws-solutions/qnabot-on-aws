<template lang="pug">
  span(class="wrapper")
    v-btn.block(
      :disabled="loading" @click="start" slot="activator"
      flat id="kendra-sync") Sync Kendra FAQ
    v-dialog(
      persistent
      v-model="snackbar"
    )
      v-card(id="kendra-syncing")
        v-card-title(primary-title) Syncing: {{request_status}}
        v-card-text
          v-subheader.error--text(v-if='error' id="error") {{error}}
          v-subheader.success--text(v-if='success' id="success") Success!
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
          v-btn(@click='cancel' flat id="kendra-close") close
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
var sleep = require('util').promisify(setTimeout)

module.exports={
  data:function(){
    var self=this
    return {
      snackbar:false,
      // loading:false,
      success:false,
      error:'',
      request_status:"Ready",
      filename:'qna-kendra-faq.txt' // do not change because same key needed for UI status updates in lambda/export/kendraSync
    }
  },
  computed:{
  },
  created:async function(){
    this.refresh() 
  },
  methods:{
    cancel:function(){
      var self=this
      self.success=false
      self.snackbar=false
    },
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
          // get status file
          var status=await self.$store.dispatch('api/getExport',job)
          Object.assign(out,coll[index],status)
          console.log(status.status);
          
          // if export status is completed, switch to running kendra sync
          if (status.status == 'Completed') status.status = 'Export finished'   // this just masks it in the UI
          self.request_status = status.status
          
          // if job is not complete and not error, poll again
          if(status.status!=="Sync Complete" && status.status!=="Error"){
            setTimeout(()=>poll(),1000)
          }
        }
      })
    },
    start:async function(){
      var self=this
      this.loading=true
      this.snackbar=true 
      this.success=false
      this.error=''
      try{
        await this.$store.dispatch('api/startKendraSyncExport',{
          name:this.filename,
          filter:''
        })
        await this.refresh()
      }catch(e){
        console.log('error')
        this.error=e
        this.request_status = 'Error'
      }finally{
        console.log('finished');
        // TODO: delete old export file
        var exports=await this.$store.dispatch('api/listExports')
        await this.$store.dispatch('api/deleteExport',exports[0])
        await sleep(10000);
        if (this.request_status=='Sync Complete') this.success = true
        await this.refresh()
      }
    }
  }
}
</script>

<style lang='scss' scoped>
  .refresh {
    flex:0; 
  }
</style>

