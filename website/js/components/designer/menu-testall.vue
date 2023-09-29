/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
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

const Vuex=require('vuex')
const saveAs=require('file-saver').saveAs
const Promise=require('bluebird')
const _=require('lodash');

import modal from './modal.vue';
import { EventBus } from './event-bus.js';

module.exports={

data:function(){
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
          const self=this
          const testalls=await this.$store.dispatch('api/listTestAll');
          this.testjobs=testalls.jobs;
          this.testjobs.map(async (job,index,coll)=>{
              const info=await this.$store.dispatch('api/getTestAll',job)
              const out={}
              Object.assign(out,coll[index],info)
              coll.splice(index,1,out)
              poll()
              async function poll(){
                  const status=await self.$store.dispatch('api/getTestAll',job)
                  Object.assign(out,coll[index],status)
                  if(status.status!=="Completed" && status.status!=="Error"){
                      setTimeout(()=>poll(),1000)
                  }
              }
          })
      },
      start:async function(){
          try{
              const now = new Date();
              const usableFilename = ( (this.filename && this.filename.length > 0) ? this.filename : 'TestAll');
              const token = window.sessionStorage.getItem('id_token');
              await this.$store.dispatch('api/startTestAll',{
                  name:usableFilename + '-' + this.dateFormat(now) + '.csv',
                  filter:this.filter,
                  token:token
              })
              await this.refresh()
          }catch(e){
              this.error=err
          }
      },
      remove:async function(index){
          await this.$store.dispatch('api/deleteTestAll',this.testjobs[index])
          await this.refresh()
      },
      download:async function(index){
          const raw=await this.$store.dispatch('api/downloadTestAll',this.testjobs[index])
          const blob = new Blob(
              [raw],
              {type: "text/plain;charset=utf-8"}
          );
          const name=this.testjobs[index].id
          return Promise.resolve(saveAs(blob,name))
      },
      quickview:async function(index){
          const raw=await this.$store.dispatch('api/downloadTestAll',this.testjobs[index])
          const rows = raw.split('\n');
          const dataRows=[];
          for (let idx=1; idx<rows.length; idx++) {
              if (rows[idx].length>0) {
                  const currentRow = rows[idx].split(',');
                  if (currentRow.length > 6) {
                      // handle case where ',' appears in last column and join into a single column'
                      const revisedRow = currentRow.slice(0,5);
                      const additions = currentRow.slice(5);
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
