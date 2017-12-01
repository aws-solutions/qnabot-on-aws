<template>
  <span class='trash' v-on:click.stop="next">
    <span class="icon"> 
      <icon v-show="!check && !loading" name="trash" v-tooltip="tooltip" 
        tabindex='-1'
      ></icon>
      <icon v-show="loading" name="spinner" class="fa-pulse"></icon>
    </span>
    <span class="text">
      <span v-show="check && !loading" class="question">
        Are you sure?
          <span v-on:click.stop="next('yes')" class="yes" >yes</span>
          <span v-on:click.stop="next('no')" class="no" >no</span>
      </span>
      <span v-show="loading" class="deleting"></span>
    </span>
  </span>
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
  props:{
    loading:Boolean,
    tooltip:{
      default:"delete"
    }
  },
  data:()=>({
    check:false
  }),
  methods:{
    next:function(rm){
      if(!this.check){
        this.check=true
        this.$emit('open')
      }else{
        if(rm==='yes'){
          this.$emit('delete')
          this.check=false
          this.$emit('close')
        }else if(rm==='no'){
          this.check=false
          this.$emit('close')
        }
      }
    }
  } 
}
</script>
