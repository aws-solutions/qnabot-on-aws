<template>
  <div v-bind:class="{open:qa.open,close:!qa.open,select:qa.select}" 
    class="QA" 
    v-on:click="open(false,$event)">
    <id 
      v-bind:qa="qa"
      v-on:error="error"
      v-on:click.native.stop.prevent="open(true,$event)"
      class="Id-header">
    </id>
    <div v-show="qa.open">
      <hr>
      <h6>Questions:</h6>
      <ul class="Qs">
        <li v-for="(question,Qindex) in qa.questions">
          <span class="container">
            <div class="question-trash" v-show="qa.edit">
              <trash 
                v-on:delete="removeQ(Qindex)"
              ></trash>   
            </div>
            <text-input ref="input"
              v-bind:field="question"
              validators="required"
              v-bind:name="'q.'+index+'.'+Qindex"
              v-bind:prefix="Qindex+': '"
              v-bind:prefixIf="qa.questions.length>1"
              v-bind:edit="qa.edit"
              placeholder="Type question here"
              v-on:update="update"
            ></text-input>
          </span>
        </li>
      </ul>
      <div class="addQuestion tab" v-bind:class="{hidden:!qa.edit}">
        <button class='add' v-on:click="add()" tabindex='-1'>
          <icon name='plus' v-tooltip="'add'" tabindex='-1'></icon>
        </button>
      </div>
      <hr>
      <h6>Answer:</h6>
      <div class="A">
        <text-input 
          validators="required"
          v-bind:field="this.qa.answer"
          v-bind:name="'a.'+this.index"
          v-bind:edit="this.qa.edit"
          placeholder="Type answer here"
          prefix="">
        </text-input>   
      </div>
      <hr>
      <h6>Attachment:</h6>
      <attachment v-bind:qa="this.qa"></attachment>
      </text-input>   
    </div>
  </div>
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

module.exports={
  props:['scoreShow','index'],
  data:()=>{return {}},
  components:{
    'id':require('./Id.vue'),
    'trash':require('./trash.vue'),
    'text-input':require('./input.vue'),
    'attachment':require('./attachment.vue')
  },
  computed:Object.assign(
    Vuex.mapState([
        'client'
    ]),
    {
    qa:function(){
      return this.$store.getters.QAlist[this.index]
    }
    }
  ),
  methods:{
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.$store.commit('setError',reason)
      }
    },
    add:function(){
      var self=this
      return this.$store.dispatch('add',{qa:this.qa})
      .catch(self.error('Unable to Add'))
    },
    update:function(){
      var self=this
      this.$store.dispatch('update',{qa:this.qa})
      .catch(self.error('Unable to Update'))
    },
    checkOpen:function(){
      this.qa.open=!this.qa.open
    },
    removeQ:function(index){
      var self=this
      return this.$store.dispatch('removeQ',{index:index,item:this.qa})
      .catch(self.error('Unable to Remove'))
    },
    select:function(){
      console.log('selected')
    },
    open:function(toggle,event){
      console.log(event)
      var self=this

      if(event.shiftKey){
        var stop=self.$store.getters.QAlist.indexOf(self.qa)+1
        var start=self.$store.getters.QAlist.length-
          self.$store.getters.QAlist
            .reverse()
            .findIndex(qa=>qa.select)-1
        console.log(start,stop)
        if(start>-1 && start<stop){
          self.$store.getters.QAlist.slice(
            start,
            stop)
          .forEach(function(qa){
            qa.open=false
            qa.edit=false
            qa.select=false
            self.$store.commit('select',qa)
          })
        }else{
          self.$store.commit('select',self.qa)
        }
      }else if(event.metaKey){
        self.$store.commit('select',self.qa)
      }else{
        self.$store.commit('unselectAll')
        var check=el=>el.text===el.tmp
        var dirty=self.qa.questions.map(check).concat([
                    Boolean(self.qa.qid),
                    check(self.qa.answer),
                    check(self.qa.qid),
                    check(self.qa.card.imageUrl),
                    check(self.qa.card.title)
                    ]).includes(false)
        if(dirty){
          self.error('please save or cancel your edits')(null)
        }else{
          this.$store.state.QAs.forEach(function(qa){
            if(qa!==self.qa){
              qa.open=false 
              qa.edit=false
            }
          })
          if(toggle){
            self.qa.open=!self.qa.open
          }else{
            self.qa.open=true
          }
          if(!self.qa.open) self.qa.edit=false
          if(self.qa.open) self.$store.commit('select',self.qa)
        }
      }
    }
  }
}
</script>
