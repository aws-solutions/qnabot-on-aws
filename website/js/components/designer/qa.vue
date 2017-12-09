<template lang='pug'>
  v-card(flat class="pl-3")
    v-card-text
      v-container
        v-layout(row)
          v-flex(xs6)
            .title Questions
              v-list(dense)
                v-list-tile(v-for="(q,index) in data.q" :key="index")
                  v-list-tile-content {{q}}
          v-flex(xs6)
            .title Answer
            p(class="pl-3") {{data.a}}
        v-layout(column)
          span(v-if="data.t")
            .title Topic
            p(class="pl-3") {{data.t}}
          span(v-if="data.r.imageUrl")
            .title ResponseCard
            p(class="pl-3") title: {{data.r.title}}
            p(class="pl-3") url: {{data.r.imageUrl}}
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
var _=require('lodash')
module.exports={
  props:['data'],
  data:()=>{return {
    advanced:false
  }},
  components:{
  },
  computed:{
  },
  methods:{}
}
</script>


