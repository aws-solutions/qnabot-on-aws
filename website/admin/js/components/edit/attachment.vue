<template>
  <div class="card">
    <div class='title-input'>
      <text-input 
        validators="optional"
        v-bind:field="this.qa.card.title"
        v-bind:name="this.qa.qid.text+'.card.title'"
        v-bind:edit="this.qa.edit"
        placeholder="Type title here"
        prefix="Title: "
        prefixIf="true"
        >
      </text-input>   
    </div>
    <div class='imageUrl-input'>
      <text-input 
        validators="url"
        v-bind:field="this.qa.card.imageUrl"
        v-bind:name="this.qa.qid.text+'.card.imageUrl'"
        v-bind:edit="this.qa.edit"
        errorMessage="Must be a valid url with no whitespaces"
        placeholder="Type imageUrl here"
        prefixIf="true"
        prefix="ImageUrl:">
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
  props:['qa'],
  data:()=>{return {}},
  components:{
    'text-input':require('./input.vue')
  }
}
</script>
