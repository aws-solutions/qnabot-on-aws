<template>
  <div>
    <div class="bar">
      <div class="Id-title">
        <div class="carret">
          <icon name="caret-down" v-show="qa.open"></icon>
          <icon name="caret-right" v-show="!qa.open"></icon>
        </div>
        <text-input
          v-bind:field="qa.qid"
          v-bind:fieldText="text"
          v-bind:name="'qid'+qa.qid.text"
          v-bind:disable="!qa.open"
          v-bind:edit="qa.edit"
          validators="required"
          prefix=""
          placeholder="Type id here"
        ></text-input>
      </div>
      <div v-show="!qa.open" class="first-question">
        <span class="text" >{{this.qa.questions[0].text}}</span>
      </div>
      <div class="controls-container">
        <window-controls 
          v-bind:qa="qa"
        ></window-controls>
      </div>
      <div class="info" >
        <span class="score"
        v-show="this.$store.state.mode==='test' && !qa.edit && !qa.open"
        >{{this.qa.score}}</span>
      </div>
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

module.exports={
  props:["qa"],
  components:{
    "text-input":require('./input.vue'),
    'window-controls':require('./window-controls.vue'),
  },
  computed:{
    text:function(){
      return this.qa.qid.text.replace('.','<wbr>.')
    }
  },
  data:()=>({})
}
</script>
