<template>
  <div class="text-input" v-bind:class="{opened:edit,closed:!edit}">
    <div class="workspace">
      <div class="text" >
        <div class="prefix" v-show="prefixIf" >{{this.prefix}}</div>
        <div 
          class='field-text' 
          v-show="!edit"
        >
          <span v-if='fieldText' v-html='text'></span>
          <span v-if='!fieldText'>{{this.text}}</span>
        </div>
        <textarea type="text"
            @input="handle"
            @focus="handle"
            v-model="field.tmp"
            v-show="edit"
            v-validate="validators"
            v-bind:name="name"
            v-on:click.stop=""
            rows='1'
            v-bind:placeholder="placeholder"
        ></textarea>
      </div>
    </div>
    <div v-if="errorMessage">
      <div class="error" v-show="invalid && edit">
        <p>{{this.errorMessage}}</p>
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
var autosize=require('autosize')
module.exports={
  props:["field","errorMessage","placeholder","prefix","name","edit","validators","prefixIf","fieldText"],
  computed:{
    invalid:function(){
      return this.$validator.errors.has(this.name)
    },
    invalidMessage:function(){
      return this.$validator.errors.collect(this.name).join(',')
    },
    text:function(){
      return this.fieldText || this.field.text 
    }
  },
  data:()=>({}),
  ready:function(){
    autosize(this.$el.getElementsByTagName('textarea')[0])
  },
  watch:{
    edit:function(){
      var self=this
      self.$nextTick(self.handle)
    }
  },
  methods:{
    handle:function(){
      autosize(this.$el.getElementsByTagName('textarea')[0])
    }
  }
}
</script>
