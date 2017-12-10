<template lang="pug">
  span(class="wrapper")
    v-dialog(v-model="loading" persistent)
      v-card
        v-card-title(primary-title) Updating
        v-card-text
          v-subheader.error--text(v-if='error') {{error}}
          v-subheader.success--text(v-if='success') {{success}}
          v-progress-linear(v-if='!error && !success' indeterminate)
        v-card-actions
          v-spacer
            v-btn(@click='cancel' flat) close
    v-dialog(persistent v-model='dialog' max-width="100%")
      v-btn(slot="activator" block icon="icon" @click="refresh") 
        v-icon edit
      v-card
        v-card-title(primary-title)
          .headline Update: {{data.qid}}
        v-card-text
          form
            v-text-field(
              name='qid' label='Question Id' id='qid' required v-model='tmp.qid'
              v-validate="'required'"
              :error-messages="errors.collect('qid')"
              data-vv-name="qid",
            )
            ul
              li(v-for="(q,index) in tmp.q")
                v-text-field(
                  name='question',label='Question',id='q' 
                  :required="tmp.q.length===1" v-model='tmp.q[index]'
                  v-validate="'required|max:140'"
                  :error-messages="errors.collect('q'+index)"
                  auto-grow 
                  :data-vv-name="q+index",
                  :counter='140'
                )
                v-btn(icon @click.native="rmQ(index)" v-if="tmp.q.length>1")
                  v-icon delete
              li
                v-text-field(
                  name='question',label='Add a new question',id='q' 
                  v-model='scratch.question'
                  v-validate="'max:140'"
                  :error-messages="errors.collect('q-scratch')" auto-grow 
                  data-vv-name="q-scratch",
                  :counter='140'
                )
                v-btn(@click.native="addQ" ) save question
            v-text-field(
              name='answer',label='answer',id='a' required textarea v-model='tmp.a'
              v-validate="'required'"
              :error-messages="errors.collect('a')"
              data-vv-name="a",
            )
            v-text-field(
              name='topic',label='topic',id='t' v-model='tmp.t'
              :error-messages="errors.collect('t')"
              data-vv-name="t",
            )
            .subheading ResponseCard
            div(class="pl-3")
              v-text-field(
                name='card-title',label='Response Card Title',id='rt' v-model='tmp.r.title'
                :error-messages="errors.collect('rt')"
                data-vv-name="rt"
              )
              v-text-field(
                name='card-url',label='Response Image Url',id='ru' v-model='tmp.r.imageUrl'
                :error-messages="errors.collect('ru')"
                data-vv-name="ru"
              ) 
          small *indicates required field
          v-subheader.error--text(v-if='error') {{error}}
        v-card-actions
          v-spacer
          v-btn(@click='cancel') Cancel
          v-btn(@click='update') Update
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
  props:['data'],
  data:function(){
    return {
      error:'',
      success:'',
      dialog:false,
      loading:false,
      scratch:{
        question:""
      },
      tmp:{
        qid:"",
        q:[],
        a:"",
        t:"",
        r:{}
      }
    }
  },
  components:{
  },
  methods:{
    cancel:function(){
      this.dialog=false
      this.loading=false
    },
    refresh:function(){
      this.tmp=_.cloneDeep(this.data)
      console.log(this)
    },
    update:function(){
      var self=this
      self.loading=true
      self.dialog=false

      return Promise.resolve((function(){
        if(self.data.qid!==self.tmp.qid){
          return self.$store.dispatch('api/check',self.tmp.qid)
        }else{
          Promise.resolve(false)
        }
      })())
      .then(function(exists){
        if(exists){
          self.dialog=true
          self.loading=false
          self.error="Question with that ID already Exists"
        }else{
          return self.$store.dispatch('data/update',self.tmp)
          .then(function(result){
            Object.assign(self.data,self.tmp)
            self.success="!success"
          })
        }
      })
    },
    rmQ:function(index){
      console.log(index)
      this.tmp.q.splice(index,1)
    },
    addQ:function(){
      this.tmp.q.push(this.scratch.question)
      this.scratch.question=''
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

