<template lang="pug">
  span(class="wrapper")
    v-dialog(v-model="loading" persistent)
      v-card(id="edit-loading")
        v-card-title(primary-title) Updating
        v-card-text
          v-subheader.error--text(
            v-if='error'
            id="edit-error"
          ) {{error}}
          v-subheader.success--text(
            v-if='success'
            id="edit-success"
          ) {{success}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
            v-btn(v-if="error" @click='cancel' flat id="edit-close") close
            v-btn(v-if="success" @click='close' flat id="edit-close") close
    v-dialog(v-model='dialog' max-width="80%")
      v-btn(v-if="!label" slot="activator" block icon="icon" @click="refresh") 
        v-icon edit
      v-btn(v-if="label" slot="activator" @click="refresh") {{label}}
      v-card(id="edit-form")
        v-card-title(primary-title)
          .headline Update: {{data.qid}}
        v-card-text
          v-form
            schema-input( 
              v-if="dialog"
              v-model="tmp"
              :valid.sync="valid"
              :schema="schema"
              :pick="required"
              path="edit"
            )
            v-expansion-panel.elevation-0
              v-expansion-panel-content( style="display:block")
                div( slot="header") Advanced
                schema-input( 
                  v-model="tmp"
                  :valid.sync="valid"
                  :schema="schema" 
                  :omit="required"
                  path="add"
                )
          small *indicates required field
          v-subheader.error--text(v-if='error') {{error}}
        v-card-actions
          v-spacer
          v-btn(@click='cancel' id="edit-cancel") Cancel
          v-btn(@click='update' :disabled="!valid" id="edit-submit") Update
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var Vuex=require('vuex')
var saveAs=require('file-saver').saveAs
var Promise=require('bluebird')
var _=require('lodash')
var empty=require('./empty')

module.exports={
  props:['data','label'],
  data:function(){
    return {
      error:'',
      success:'',
      dialog:false,
      loading:false,
      opened:false,
      valid:true,
      tmp:{}
    }
  },
  components:{
    "schema-input":require('./input.vue').default
  },
  computed:{
    type:function(){
      return this.data.type || 'qna'
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
      this.dialog=false
      this.loading=false
    },
    close:function(){
      this.cancel()
      this.$emit('filter')
    },
    refresh:function(){
      if(!this.opened){
        this.tmp=_.merge(empty(this.schema),_.cloneDeep(this.data))
        this.opened=true
      }
    },
    update:async function(){
      var self=this
      if(this.valid){
        self.loading=true;
        self.dialog=false;
        self.error='';
        try{
          if(self.data.qid!==self.tmp.qid){
            var exists=await self.$store.dispatch('api/check',self.tmp.qid)
            if(exists){
              throw "Question with that ID already Exists"
            }else{
              await self.$store.dispatch('api/remove',self.data.qid)
            }
          }
          var newdata = clean(_.cloneDeep(self.tmp));
          delete newdata.quniqueterms;
          await self.$store.dispatch('data/update',newdata)
          self.$emit('update:data',_.cloneDeep(newdata))
          self.success="success!"
        }catch(error){
          self.dialog=true
          self.loading=false
          console.log(error)
          self.error=error
        }
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
  li {
    display:flex;
  }
</style>

