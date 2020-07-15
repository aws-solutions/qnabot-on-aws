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
        v-card-title(primary-title) Syncing  : {{status}}
        v-card-text
          v-subheader.error--text(v-if='error' id="error") {{error}}
          v-subheader.success--text(v-if='success' id="success") Success! 
          v-subheader.error--text(v-if='message' ) {{message}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
          v-btn(@click='cancel' flat id="close") close
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

module.exports={
  data:function(){
    return {
      snackbar:false,
      loading:false,
      success:false,
      error:''
    }
  },
  computed:{
    status:function(){
      return _.get(this,"$store.state.bot.status","Ready")
    },
    message:function(){
      return _.get(this,"$store.state.bot.build.message")
    }
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
          var status=await self.$store.dispatch('api/getExport',job)
          Object.assign(out,coll[index],status)
          console.log(status.status)
          if(status.status!=="Completed" && status.status!=="Error"){
            setTimeout(()=>poll(),1000)
          }
        }
        // TODO: status updates beyond just the export
      })
    },
    start:async function(){
      var self=this
      this.loading=true
      this.snackbar=true 
      this.success=false
      this.error=false
      try{
        await this.$store.dispatch('api/startKendraSyncExport',{
          name:'qna-kendra-faq.txt',
          filter:''
        })
        await this.refresh()
      }catch(e){
        this.error=e
      }finally{
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

