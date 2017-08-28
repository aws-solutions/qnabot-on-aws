<template>
  <div class='edit-spinner'>
    <i 
      v-show="this.$store.state.loading &&  $store.state.QAs.length===0" 
      class="fa fa-spinner fa-pulse fa-3x fa-fw">
    </i>
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
  props:["loading"],
  data:()=>({})
}
</script>
