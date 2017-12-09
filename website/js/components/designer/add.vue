<template lang="pug">
  span(class="wrapper")
    v-dialog(v-model="loading" persistent)
      v-card
        v-card-title(primary-title) Creating {{data.qid}}
        v-card-text
          v-subheader.error--text(v-if='error') {{error}}
          v-subheader.success--text(v-if='success') {{success}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
            v-btn(@click='cancel' flat) close
    v-dialog(persistent v-model='dialog' max-width='50%')
      v-btn(slot="activator" block @click='reset') Add
      v-card
        v-card-title(primary-title)
          .headline Add new question
        v-card-text
          v-form
            v-text-field(
              name='qid' label='Question Id' id='qid' required v-model='data.qid'
              v-validate="'required'"
              :error-messages="errors.collect('qid')"
              data-vv-name="qid",
            )
            v-text-field(
              name='question',label='Question',id='q' required v-model='data.q'
              v-validate="'required|max:140'"
              :error-messages="errors.collect('q')"
              data-vv-name="q",
              :counter='140'
            )
            v-text-field(
              name='answer',label='answer',id='a' required textarea v-model='data.a'
              v-validate="'required|max:140'"
              :error-messages="errors.collect('a')"
              data-vv-name="a",
            )
          small *indicates required field
          v-subheader.error--text(v-if='error') {{error}}
        v-card-actions
          v-spacer
          v-btn(@click='cancel') Cancel
          v-btn(@click='add' :disabled='!valid') Create
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
module.exports={
  $validates:true,
  data:function(){
    return {
      error:'',
      success:'',
      dialog:false,
      loading:false,
      data:{
        qid:'',
        q:'',
        a:''
      }
    }
  },
  components:{
  },
  computed:{
    valid:function(){
      return this.$validator.errors.items.length===0
    }
  },
  methods:{
    cancel:function(){
      this.dialog=false
      this.loading=false
      this.reset()
    },
    reset:function(){
      console.log(this.data)
      _.mapKeys(this.data,(v,k,obj)=>obj[k]='')
      this.$validator.reset()
    },
    add:function(){
      var self=this
      this.$validator.validateAll()

      if(this.valid){
        this.loading=true
        this.dialog=false
      
        return this.$store.dispatch('api/check',this.data.qid)
        .then(function(exists){
          console.log(exists)
          if(exists){
            self.error='Question already exists'
            self.loading=false
            self.dialog=true
          }else{
            return self.$store.dispatch('data/add',Object.assign({},self.data))
            .tap(()=>self.success='Success!')
            .map(x=>self.$store.commit('data/addQA',x))
          }
        })
        .catch(error=>self.error=error)
      }
    }
  }
}
</script>

<style lang='scss' scoped>
  .wrapper {
    display:inline-block;
  }
</style>

