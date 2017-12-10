<template lang='pug'>
  v-card.root-card
    v-tabs(v-model="tab")
      v-tabs-bar(:v-model="active" class="primary" light)
        v-tabs-item.title(ripple href="#questions") Questions
        v-tabs-item.title(ripple href="#test") Simulate
        v-tabs-slider(color="accent")
      v-tabs-items
        v-tabs-content(id="questions")
          questions(@filter="get(pagination)")
        v-tabs-content(id="test")
          test
    v-divider
    v-data-table(
      :headers="headers"
      :items="QAs"
      :search="search"
      :pagination.sync="pagination"
      :total-items="$store.state.page.total"
      :loading="loading"
      :rows-per-page-items="perpage"
      v-model="selected"
      select-all
      item-key="qid"
    )
      template(slot='headers' slot-scope='props')
        tr
          th.shrink(v-if="tab==='questions'")
            v-checkbox(:indeterminate="QAs.length===0" v-model='selectAll' tabindex='-1')
          th.shrink.title(v-if="tab==='test'") score
          th.text-xs-left.title( v-for="header in props.headers" 
            :key='header.text'
            :class="['column sortable', pagination.descending ? 'desc' : 'asc', header.value === pagination.sortBy ? 'active' : '']"
            @click="changeSort(header.value)") 
              v-icon(v-if="tab==='questions'") arrow_upward
              span {{header.text}}
      template(slot='items' slot-scope='props')
        tr( v-on:click="props.expanded = !props.expanded")
          td.shrink(v-on:click.stop="" v-if="tab==='questions'")
            v-checkbox(v-model="props.item.select" tabindex='-1')
          td.text-xs-left.shrink.primary--text.title(v-if="tab==='test'") {{props.item.score}}
          td.text-xs-left.shrink.title {{props.item.qid}}
          td.text-xs-left {{props.item.q[0]}}
          span.buttons
            edit(:data="props.item" @click.native.stop="")
            delete( icon=true :data="props.item" @click.native.stop="")
      template(slot="no-data")
        v-alert( :value="true" color="error" icon="warning")
            span Sorry, nothing to display here :(
      template(slot="expand" slot-scope='props')
        qa(:data="props.item")
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
  data:()=>{return {
    drawer:false,
    active:null,
    tab:"",
    search:'',
    selected:[],
    selectAll:false,
    perpage:[
      "5","10","15"
    ],
    pagination:{
      page:1,
      rowsPerPage:10,
      sortBy:'qid'
    },
    headers:[{
      text:'qid',
      value:'qid',
      align:'left',
      sortable:true
    },
    {
      text:'question',
      value:'q[0]',
      align:'left'
    }]
  }},
  components:{
    qa:require('./qa.vue'),
    questions:require('./menu-questions.vue'),
    test:require('./menu-test.vue'),
    delete:require('./delete.vue'),
    edit:require('./edit.vue')
  },
  computed:{
    loading:function(){
      return this.$store.state.api.loading 
    },
    QAs:function(){
      return this.$store.state.data.QAs
    }
  },
  created:function(){},
  watch:{
    tab:function(tab){
      if(tab==='test'){
        this.pagination.sortBy='score'
        this.pagination.descending=true
      }else{
        this.pagination.sortBy='qid'
        this.pagination.descending=false
      }
    },
    pagination:function(event){
      return this.get(event)      
    },
    selectAll:function(value){
      console.log('value')
      this.$store.commit('data/selectAll',value)
    }
  },
  methods:{
    get:function(event){
      return this.$store.dispatch('data/get',{
        page:event.page-1,
        perpage:event.rowsPerPage,
        order:event.descending ? 'desc' : 'asc'
      }) 
    },
    changeSort:_.debounce(function(column) {
      if(this.tab==='questions'){
        if (this.pagination.sortBy === column) {
          this.pagination.descending = !this.pagination.descending
        } else {
          this.pagination.sortBy = column
          this.pagination.descending = false
        }
        this.get(this.pagination)
      }
    },500,{trailing:false,leading:true}),
    edit:console.log
  }
}
</script>
<style lang='scss'>
  .tabs__item {
    color:white !important; 
  }
  
</style>
<style lang='scss' scoped>
  
  .shrink {
    width:10%;
  }
  .root-card {
    max-width:900px;
    margin:auto;
  }
  .icon {
    cursor:pointer;
  }
  .datatable thead th.title {
    .icon {
      font-size:inherit;
    }
  }
  .buttons {
    position:absolute;
    right:0;
  }
  tr {
    position:relative;
  }
</style>

