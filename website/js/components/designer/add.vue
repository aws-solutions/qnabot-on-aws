<template lang="pug">
  span(class="wrapper")
    v-dialog(v-model="loading" persistent)
      v-card
        v-card-title(primary-title) Creating {{data.qid}}
        v-card-text
          v-subheader.error--text(v-if='error' id="add-error") {{error}}
          v-subheader.success--text(v-if='success' id="add-success") {{success}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
            v-btn(@click='cancel' flat id="add-close") close
    v-dialog(persistent v-model='dialog' max-width='50%' ref="dialog")
      v-btn(slot="activator" @click='reset' id="add-question-btn") Add
      v-card(id="add-question-form")
        v-card-title(primary-title)
          .headline {{title}}
        v-card-text.pb-0
          .title document type
          v-radio-group(v-model="type" row)
            v-radio(v-for="t in types" v-bind:key='t' :label='t' :value="t")
        v-card-text.pt-0
          v-form(v-if="dialog")
            schema-input( 
              v-model="data[type]"
              :valid.sync="valid.required"
              :schema="schema" 
              :pick="required"
              path="add"
              ref="requiredInput"
            )
            v-expansion-panel.elevation-0
              v-expansion-panel-content
                div( slot="header") Advanced
                schema-input( 
                  v-model="data[type]"
                  :valid.sync="valid.optional"
                  :schema="schema" 
                  :omit="schema.required"
                  ref="optionalInput"
                  path="add"
                )
          small *indicates required field
          v-subheader.error--text(v-if='error') {{error}}
        v-card-actions
          v-spacer
          v-btn(@click='cancel' id="add-question-cancel") Cancel
          v-btn(@click='add' :disabled='!valid' id="add-question-submit") Create
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
  data:function(){
    return {
      title:"Add New Item",
      error:'',
      success:'',
      type:'qna',
      dialog:false,
      loading:false,
      valid:{
        required:false,
        optional:false
      },
      data:{}
    }
  },
  components:{
    "schema-input":require('./input.vue').default
  },
  computed:{
    types:function(){
      return Object.keys(this.$store.state.data.schema).sort()
    },
    schema:function(){
      return _.get(this,`$store.state.data.schema[${this.type}]`,{type:"object"})
    },
    required:function(){
      return _.get(this,'schema.required',[])
    }
  },
  methods:{
    cancel:function(){
      this.reset()
      this.loading=false
      this.dialog=false
      this.error=false
    },
    reset:function(){
      this.data=_.mapValues(this.$store.state.data.schema,(value,key)=>{
        return empty(value) 
      }) 
      this.$refs.dialog.$refs.dialog.scrollTo(0,0)
    },
    validate:function(){
      var data=this.data[this.type]
      return !!validate(value) || validate.errors.map(x=>x.message).join('. ')
    },
    add:async function(){
      var self=this
      this.error=false
      var data=clean(_.cloneDeep(this.data[this.type]))
      var validate=ajv.compile(this.schema || true)
      console.log(data)
      var valid=validate(data)

      if(valid){
        this.loading=true
        this.dialog=false
        try{ 
          var exists=await this.$store.dispatch('api/check',data.qid)
          if(exists){
            self.error='Question already exists'
            self.loading=false
            self.dialog=true
          }else{
            self.$refs.dialog.$refs.dialog.scrollTo(0,0)
            data.type=this.type
            await self.$store.dispatch('data/add',data)
            self.success='Success!'
            self.$store.commit('data/addQA',_.cloneDeep(data))
            self.reset()
          }
        }catch(e){
          console.log(e)
          self.error=e 
        }
      }else{
        this.error=validate.errors.map(x=>x.message).join('. ')
      }
    }
  }
}

function clean(obj){
    if(Array.isArray(obj)){
        for( var i=0; i<obj.length; i++){
            obj[i]=clean(obj[i])
        }
        var out=_.compact(obj)
        return out.length ? out : null
    }else if(typeof obj==="object"){
        for (var key in obj){
            obj[key]=clean(obj[key])
        }
        var out=_.pickBy(obj)
        return _.keys(out).length ? out : null
    }else if(obj.trim){
        return obj.trim() || null
    }else{
        return obj
    }
}
</script>

<style lang='scss' scoped>
  .wrapper {
    display:inline-block;
  }
</style>

