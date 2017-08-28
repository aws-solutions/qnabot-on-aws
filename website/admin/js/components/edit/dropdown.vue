<template>
  <button class="dropdown" v-on:click="open=!open">
    <span class="dropdown-title" >
      <i class="fa fa-caret-down" v-show="open"></i>
      <i class="fa fa-caret-right" v-show="!open"></i>
      <span>{{title1}}/<wbr>{{title2}}</span>
    </span>
    <div class="dropdown-content" v-bind:class="{open:open}">
      <slot></slot>
    </div>
  </button>
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
  props:["title1","title2"],
  data:function(){
    return {
      open:false
    }
  }
}
</script>
