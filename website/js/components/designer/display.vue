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
  span
    span(v-if="schema.type==='string' && !empty")
      v-container.pa-0.fluid
        v-layout(:row="row" :column="column")
          v-flex
            .title {{schema.title}}
            span.pl-3( :data-path="path" ) {{value}} 
    span(v-if="schema.type==='number' && !empty")
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
const Vuex=require('vuex')
const saveAs=require('file-saver').saveAs
const Promise=require('bluebird')
const _=require('lodash')
const empty=require('./empty')
const Ajv=require('ajv')
const ajv=new Ajv()

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
      const self=this
      function helperSort(nextDepth){
        return Object.keys(nextDepth)
        .filter(x=>Object.keys(self.value).includes(x))
        .map(function(x){
          const out=_.cloneDeep(nextDepth[x])
          out.name=x
          return out
        })
        .sort((x,y)=>{
          return _.get(x,'propertyOrder',Number.MAX_SAFE_INTEGER)-_.get(y,'propertyOrder',Number.MAX_SAFE_INTEGER)
        })
      }
      function recurseDown(currentDepth){
          if(_.has(currentDepth,"properties")){
            for(const key in Object.keys(currentDepth.properties)){
              recurseDown(key)
            }
            return helperSort(currentDepth.properties)
          }
          if(_.has(currentDepth,"items.properties")){
            for(const key in Object.keys(currentDepth.items.properties)){
              recurseDown(key)
            }
            return helperSort(currentDepth.properties)
          }
        return currentDepth
      } 
      if (this.schema.properties) {
        return recurseDown(this.schema);
      }
    },
  },
  methods:{
  }
}
</script>

<style lang='scss' scoped>
</style>
