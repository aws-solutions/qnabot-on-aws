<template lang="pug">
  span(class="wrapper")
    v-btn.block(
      :disabled="!(kendraFaqEnabled && !loading)" @click="start" slot="activator"
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
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
var Promise=require('bluebird')
var _=require('lodash')
var sleep = require('util').promisify(setTimeout)

module.exports={
  data:function(){
    var self=this
    return {
      snackbar:false,
      loading:false,
      success:false,
      error:'',
      request_status:"Ready",
      filename:'qna-kendra-faq.txt', // do not change because same key needed for UI status updates in lambda/export/kendraSync
      kendraFaqEnabled:false,
    }
  },
  computed:{
  },
  created:function(){
  },
  mounted:function(){
    const self=this
    setTimeout(async function() {
      const settings=await self.$store.dispatch('api/listSettings');
      // console.log(`${JSON.stringify(settings[2],null,2)}`);
      self.kendraFaqEnabled = _.get(settings[2],"KENDRA_FAQ_INDEX")!=="";
    }, 2000);
  },
  methods:{
    cancel:function(){
      var self=this
      self.success=false
      self.snackbar=false
      self.loading=false
    },
    refresh:async function(){
      var self=this
      var exports=await this.$store.dispatch('api/listExports')
      this.exports=exports.jobs
      var info = await this.$store.dispatch('api/getExportByJobId', 'qna-kendra-faq.txt');
      
      if (info.status !== 'Sync Complete') {
        await poll();
      }
      
      async function poll(){
        // console.log('poll starting');
        // get status file
        var status = await self.$store.dispatch('api/getExportByJobId', 'qna-kendra-faq.txt');
        console.log(status.status);
        
        // if export status is completed, switch to running kendra sync
        if (status.status == 'Completed') status.status = 'Export finished. Running KendraSync'   // this just masks it in the UI
        
        self.request_status = status.status
        
        // if job is not complete and not error, poll again
        if(status.status!=="Sync Complete" && status.status!=="Error"){
          setTimeout(()=>poll(),1000)
        }
        
        if (self.request_status==='Sync Complete'){
          self.success = true
        } else if (self.request_status==='Error'){
          self.error='Error!'
        }
        self.loading=false
      }
    },    
    start:async function(){
      var self=this
      this.loading=true
      this.snackbar=true
      this.success=false
      this.error=''
      this.request_status="Ready"
      try{
        await this.$store.dispatch('api/startKendraSyncExport',{
          name:this.filename,
          filter:''
        })
        await this.refresh()
      }catch(e){
        // never enters this block
      }finally{
        // never enters this block
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

