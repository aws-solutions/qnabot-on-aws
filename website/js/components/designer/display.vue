<template lang="pug">
  span
    span(v-if="schema.type==='string' && !empty")
      v-container.pa-0.fluid
        v-layout(:row="row" :column="column")
          v-flex
            .title {{schema.title}}
            span.pl-3( :data-path="path" ) {{value}} 
    span(v-if="schema.type==='array' && !empty")
      v-container.fluid.pa-0
        v-layout(:row="row" :column="column" )
          v-flex
            //.title {{schema.title}}
            display(  
              v-for="(item,index) in value" :key="index"
              :schema="schema.items"
              :value="item" 
              :path="path+'['+index+']'" )
    span(v-if="schema.type==='object' && !empty")
      v-container.fluid
        v-layout(:row="row" :column="column")
          .title {{schema.title}}
          v-flex.pl-3(v-for="(property,key) in schema.properties" 
            style="flex:1;"
            :key="key" 
            v-if="value[key]")
            display(  
              :path="path+'.'+key"
              :name="key"
              column
              :schema="schema.properties[key]"
              :value="value[key]" 
            )
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
var Vuex=require('vuex')
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')
var _=require('lodash')
var empty=require('./empty')
var Ajv=require('ajv')
var ajv=new Ajv()

module.exports={
  props:["schema","value","name","row","column","path"],
  name:'display',
  data:function(){
    return {}
  },
  components:{},
  computed:{
    empty:function(){
      if(this.schema.type==="array"){
        return this.value.length===0
      }else if(this.schema.type==="object"){
        return !_.values(this.value).map(x=>!!x).includes(true)
      }else {
        return !this.value
      }
    },
    properties:function(){
      var self=this
      function helperSort(nextDepth){
        return Object.keys(nextDepth)
        .filter(x=>Object.keys(self.value).includes(x))
        .map(function(x){
          var out=_.cloneDeep(nextDepth[x])
          out.name=x
          return out
        })
        .sort((x,y)=>{
          return _.get(x,'propertyOrder',Number.MAX_SAFE_INTEGER)-_.get(y,'propertyOrder',Number.MAX_SAFE_INTEGER)
        })
      }
      function recurseDown(currentDepth){
          if(_.has(currentDepth,"properties")){
            for(var key in Object.keys(currentDepth.properties)){
              recurseDown(key)
            }
            return helperSort(currentDepth.properties)
          }
          if(_.has(currentDepth,"items.properties")){
            for(var key in Object.keys(currentDepth.items.properties)){
              recurseDown(key)
            }
            return helperSort(currentDepth.properties)
          }
        return currentDepth
      } 
      if(this.schema.properties){
        return recurseDown(this.schema)
      }else{
        []
      }
    },
  },
  methods:{
  }
}
</script>

<style lang='scss' scoped>
</style>
