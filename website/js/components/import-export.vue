<template lang='pug'>
  v-card
    v-container
      v-layout(column)
        v-flex
          h4 Import
          v-text-field(name="url" label="url" id="url" clearable )
          v-btn(@click="dialog=true") url
          v-btn(@click="dialog=true") file
        v-divider
        v-flex(row)
          h4 export
          v-text-field(name="filter" label="filter" id="filter" clearable )
          v-btn(@click="download" flat ) filtered 
          v-btn(@click="download" flat ) all
    v-dialog(v-model="loading" persistent)
      v-card
        v-card-title Loading
        v-card-text
          v-progress-linear(indeterminate)
    v-dialog(v-model="dialog")
      v-card
        v-card-title Confirm
        v-card-text are you sure?
        v-card-actions
          v-spacer
          input(type="file" 
              ref="file"
              id="file"
              style="display:none;" 
              v-on:change="upload")
          v-btn(@click="dialog=false" flat ) cancel
          v-btn(@click="$refs.file.click()" flat ) continue
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
  data:function(){
    return {
      dialog:false,
      loading:false
    }
  },
  components:{
  },
  methods:{
    download:function(){
      var self=this
      this.loading=true
      setTimeout(()=>self.loading=false,5000)
    },
    upload:function(){
      var self=this
      console.log(this.$refs)
      console.log('upload')
      this.dialog=false
      this.loading=true
      setTimeout(()=>self.loading=false,5000)
    }
  }
}
</script>
