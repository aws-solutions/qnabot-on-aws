<template lang="pug">
  v-container(column grid-list-md)
    v-layout(row)
      v-flex(xs5)
        v-text-field(
            name="filename"
            label="Filename"
            v-model="filename"
            id="filename"
            clearable
          )
        v-text-field(
            name="filter"
            label="(optional) filter test all by qid prefix"
            v-model="filter"
            id="filter"
            clearable
          )
        v-btn(@click="start" id="testAll") Test All
    v-layout(row)
      v-flex(v-if="testjobs.length>0")
        v-card(id="test-jobs")
          v-card-title.headline Tests
          v-card-text
            v-list
              template(v-for="(job,index) in testjobs")
                v-list-tile(:id="'test-job-'+job.id" :data-status="job.status")
                  v-list-tile-content.job-content
                    v-list-tile-title {{job.id}}: {{job.status}}
                    v-list-tile-sub-title
                      v-progress-linear(v-bind:indeterminate="isIndeterminate(job)" v-model="job.progress*100")
                  v-list-tile-action.job-actions(
                    style="flex-direction:row; width:80px;"
                  )
                    v-btn(fab block icon @click="remove(index)")
                      v-icon delete
                    v-btn(fab block
                      v-show="job.status==='Completed'"
                      icon @click="download(index)" :loading="job.loading")
                      v-icon file_download
                    v-btn(fab block
                      v-show="job.status==='Completed'"
                      icon @click="quickview(index)" :loading="job.loading")
                      v-icon open_in_browser

                v-divider(v-if="index + 1 < testjobs.length")
    v-layout(row)
      v-flex(v-if="isModalVisible")
        modal(v-bind:table-data="tableData"
              v-bind:table-header="tableHeader")
</template>

<script>
/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/

var Vuex=require('vuex')
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')
var _=require('lodash');

import modal from './modal.vue';
import { EventBus } from './event-bus.js';

module.exports={

data:function(){
    var self=this
    return {
        isModalVisible:false,
        loading:false,
        error:"",
        success:'',
        filter:"",
        filename:"TestAll",
        testjobs:[
        ],
    }
},
  components:{
    modal,
  },
  created:async function() {
    const me = this;
      this.refresh();
      EventBus.$on('closemodal', function () {
          me.closeModal();
      });
  },
  computed:{
  },
  methods:{
      isIndeterminate(job) {
          return (job.status==="Completed" ? false : true);
      },
      showModal() {
          this.isModalVisible = true;
      },
      closeModal() {
          this.isModalVisible = false;
      },
      dateFormat: function(d) {
          let month = '' + (d.getMonth() + 1);
          let day = '' + d.getDate();
          let year = d.getFullYear();
          let hours = '' + d.getHours();
          let minutes = '' + d.getMinutes();
          let milliseconds = '' + d.getMilliseconds();
          if (month.length < 2)
              month = '0' + month;
          if (day.length < 2)
              day = '0' + day;
          if (hours.length < 2) {
              hours = '0' + hours;
          }
          if (minutes.length < 2) {
              minutes = '0' + minutes;
          }
          if (milliseconds.length === 1) {
              milliseconds = '00' + milliseconds;
          } else if (milliseconds.length === 2) {
              milliseconds = '0' + milliseconds;
          }
          return [year, month, day, hours, minutes, milliseconds].join('-');
      },
      refresh:async function(){
          var self=this
          var testalls=await this.$store.dispatch('api/listTestAll');
          this.testjobs=testalls.jobs;
          this.testjobs.map(async (job,index,coll)=>{
              var info=await this.$store.dispatch('api/getTestAll',job)
              var out={}
              Object.assign(out,coll[index],info)
              coll.splice(index,1,out)
              poll()
              async function poll(){
                  var status=await self.$store.dispatch('api/getTestAll',job)
                  Object.assign(out,coll[index],status)
                  if(status.status!=="Completed" && status.status!=="Error"){
                      setTimeout(()=>poll(),1000)
                  }
              }
          })
      },
      start:async function(){
          var self=this
          try{
              const now = new Date();
              const usableFilename = ( (this.filename && this.filename.length > 0) ? this.filename : 'TestAll');
              await this.$store.dispatch('api/startTestAll',{
                  name:usableFilename + '-' + this.dateFormat(now) + '.csv',
                  filter:this.filter
              })
              await this.refresh()
          }catch(e){
              this.error=err
          }finally{
          }
      },
      remove:async function(index){
          await this.$store.dispatch('api/deleteTestAll',this.testjobs[index])
          await this.refresh()
      },
      download:async function(index){
          var raw=await this.$store.dispatch('api/downloadTestAll',this.testjobs[index])
          var blob = new Blob(
              [raw],
              {type: "text/plain;charset=utf-8"}
          );
          var name=this.testjobs[index].id
          return Promise.resolve(saveAs(blob,name))
      },
      quickview:async function(index){
          var raw=await this.$store.dispatch('api/downloadTestAll',this.testjobs[index])
          var blob = new Blob(
              [raw],
              {type: "text/plain;charset=utf-8"}
          );
          var name=this.testjobs[index].id;
          const rows = raw.split('\n');
          const dataRows=[];
          for (let idx=1; idx<rows.length; idx++) {
              if (rows[idx].length>0) {
                  let currentRow = rows[idx].split(',');
                  if (currentRow.length > 6) {
                      // handle case where ',' appears in last column and join into a single column'
                      let revisedRow = currentRow.slice(0,5);
                      let additions = currentRow.slice(5);
                      revisedRow.push(additions.join(","));
                      dataRows.push(revisedRow);
                  } else {
                      dataRows.push(currentRow);
                  }
              }
          }
          this.tableHeader = rows[0].split(',');
          this.tableData = dataRows;
          this.showModal();
          return Promise.resolve()
      }
  }
}
</script>
