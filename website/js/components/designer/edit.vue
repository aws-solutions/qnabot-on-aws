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
              :pick="schema.required"
              path="edit"
            )
            v-expansion-panel.elevation-0
              v-expansion-panel-content( style="display:block")
                div( slot="header") Advanced
                schema-input( 
                  v-model="data"
                  :valid.sync="valid"
                  :schema="schema" 
                  :omit="schema.required"
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
    "schema-input":require('./input.vue')
  },
  computed:{
    type:function(){
      return this.data.type || 'qna'
    },
    schema:function(){
      return this.$store.state.data.schema[this.type]
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
        self.loading=true
        self.dialog=false
        try{
          if(self.data.qid!==self.tmp.qid){
            var exists=await self.$store.dispatch('api/check',self.tmp.qid)
            if(exists){
              throw "Question with that ID already Exists"
            }else{
              await self.$store.dispatch('api/remove',self.data.qid)
            }
          }
          
          await self.$store.dispatch('data/update',self.tmp)
          self.$emit('update:data',_.cloneDeep(self.tmp))
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
</script>

<style lang='scss' scoped>
  .wrapper {
    display:inline-block;
  }
  li {
    display:flex;
  }
</style>

