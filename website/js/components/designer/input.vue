<template lang="pug">
  div.input
    v-text-field(
      v-if="schema.type==='string' || schema.type==='text'"
      :label="schema.title"
      :hint="schema.description"
      persistent-hint
      :required="required"
      v-model="local"
      :rules='[rules.required,rules.schema]'
      :id='id' :data-vv-name='id'
      :textarea="schema.maxLength>'5001'"
      :data-path="path"
      @update:error="setValid"
      auto-grow
      :counter="schema.maxLength"
    )
    div(v-if="schema.type==='array'")
      .subheading {{schema.title}}
      span {{schema.description}}
      ul.pl-3
        li(v-for="(item,index) in value" :key="index")
          schema-input(
            :ref="index"
            :schema="schema.items" 
            v-model="value[index]"
            :index="index"
            :required="index===0"
            :name="name"
            :path="path+'['+index+']'"
            style="display:inline-block;width:80%"
            @update:valid="isValid"
          )
          v-btn.delete(icon @click.native='remove(index)' 
            :id="path+'-remove-'+index"
            tabindex='-1')
            v-icon delete
      v-btn.block(@click.native='add' tabindex='-1'
        :id="path+'-add'"
        ) Add Item
    div(v-if="schema.type==='object'")
      .subheading {{schema.title}}
      span {{schema.description}}
      ul
        li(v-for="(property,index) in properties" :key="index")
          schema-input(
            :ref="property.name"
            :required="ifRequired(property.name)"
            :schema="property"
            :name="property.name"
            v-model="value[property.name]"
            :path="path+'.'+property.name"
            @update:valid="isValid"
          )
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
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')
var _=require('lodash')
var empty=require('./empty')
var Ajv=require('ajv')
var ajv=new Ajv()

module.exports={
  props:["schema","value","required","name","index","path"],
  name:'schema-input',
  data:function(){
    var self=this
    return {
      valid:true,
      local:this.value,
      rules:{
        required:function(value){
          return (self.required ? 
            (value && value.trim ? value.trim().length>0 : false) 
            : true)  || "Required"
        },
        schema:function(value){
          var validate=ajv.compile(self.schema || true)
          return !!validate(value) || validate.errors.map(x=>x.message).join('. ')
        }
      }
    }
  },
  components:{},
  watch:{
    local:function(v){
      this.$emit('input',v)
    },
    value:function(v){
      this.local=v
    }
  },
  computed:{
    properties:function(){
      var self=this
      if(this.schema.properties){ 
        return Object.keys(this.schema.properties)
        .filter(x=>Object.keys(self.value).includes(x))
        .map(function(x){
          var out=_.cloneDeep(self.schema.properties[x])
          out.name=x
          return out
        })
        .sort((x,y)=>{
          return _.get(y,'propertyOrder',0)-_.get(x,'propertyOrder',0)
        })
      }else{
        []
      }
    },
    validate:function(){
      var r=this.required ? 'required' : ''
      if(this.schema.maxLength){
          r+='|max:'+this.schema.maxLength
      }
      return r
    },
    id:function(){
      return this.index ? `${this.name}-${this.index}` : this.name
    }
  },
  methods:{
    remove:function(index){
      this.value.splice(index,1)
    },
    add:function(){
      this.value.push(empty(this.schema.items))
    },
    reset:function(){
      this.local=empty(this.schema)
    },
    ifRequired:function(key){
      return this.schema.required ? this.schema.required.includes(key) : false
    },
    isValid:function(value){
      var tmp=_.flatten(_.values(this.$refs))
        .filter(x=>x.required)
        .map(x=>x.valid)
      
      this.valid=!tmp.includes(false) && value
      this.$emit('update:valid',this.valid)
    },
    setValid:function(value){
      this.valid=!value 
      this.$emit('update:valid',this.valid)
    }
  }
}
</script>

<style lang='scss'>
  .input {
    ul {
      list-style:none;
      
      .delete {
        flex:0;
      }
    }

  }
</style>
