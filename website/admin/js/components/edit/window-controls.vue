<template>
  <div class="window-controls" v-bind:class="{'window-controls-open':opened}">
    <icon 
      name="pencil" 
      v-on:click.native.stop="qa.edit=true"
      v-show="qa.open && !qa.edit && !loading"
      v-tooltip="'edit'"
    ></icon>
    <icon name="floppy-o" 
      v-on:click.native.stop="save"
      v-show="qa.edit && qa.open && !loading"
      v-tooltip="'save'"
      tabindex='-1'
    ></icon>
    <icon name="ban" 
      v-on:click.native.stop="cancel"
      v-show="qa.edit && qa.open && !loading"
      v-tooltip="'cancel'"
      tabindex='-1'
    ></icon>
    <icon v-show="loading" name="spinner" class="fa-pulse"></icon>
    <trash 
      v-on:delete="rm"
      v-on:open="opened=true"
      v-on:close="opened=false"
      v-bind:loading="qa.deleting"
      v-show="!loading && qa.open"
      tabindex='-1'
    ></trash>   
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

module.exports={
  data:function(){
    return {
      opened:false,
      loading:false,
      deleting:false
    }
  },
  components:{
    "trash":require('./trash.vue')
  },
  props:['qa'],
  methods:{
    error:function(reason){
      var self=this
      return function(error){
        console.log('Error',error)
        self.loading=false
        self.$store.commit('setError',reason)
      }
    },
    save:function(){
      var self=this
      if(this.qa.qid.tmp && this.qa.answer.tmp && this.qa.questions[0].tmp){
        this.loading=true
        this.qa.edit=false
        var save=item=>item.text=item.tmp
        save(this.qa.card.title)
        save(this.qa.card.imageUrl)
        this.qa.card.text=JSON.stringify({
          title:this.qa.card.title.text,
          imageUrl:this.qa.card.imageUrl.text
        })
        save(this.qa.answer)
        this.qa.questions.forEach(save)
        
        save(this.qa.topic)
            
        var id_update=this.qa.qid.text===this.qa.qid.tmp
        if(id_update){
          save(this.qa.qid)
          return this.$store.dispatch('data/update',{qa:this.qa})
            .tap(()=>self.loading=false)
            .catch(self.error('could not update'))
        }else{
          return this.$store.dispatch('data/changeId',{
            qa:this.qa,
            New:this.qa.qid.tmp
          })
          .tap(()=>self.loading=false)
          .catch(self.error('could not update'))
        }
      }else{
        self.error('Please input and ID, Answer, and Question')('No Id')
      }
    },
    cancel:function(){
      this.qa.edit=false
      var revert=item=>item.tmp=item.text
      if(this.qa.qid.text){
        revert(this.qa.card.title)
        revert(this.qa.card.imageUrl)
        revert(this.qa.answer)
        revert(this.qa.qid)
        this.qa.questions.forEach(revert)
      }else{
        console.log(this.qa)
        
        this.$store.commit('data/delQA',index)
      }
    },
    rm:function(){
      var self=this
      if(this.qa.qid.text){
        self.qa.deleting=true
        this.$store.dispatch('data/removeQA',{qid:this.qa.qid.text})
        .catch(self.error('could not delete'))
        .finally(()=>self.qa.deleting=false)
      }else{
        var index=this.$store.state.QAs.indexOf(this.qa)
        this.$store.commit('data/delQA',index)
      }
    }
  }
}
</script>
