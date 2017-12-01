<template lang='pug'>
  section
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
    return {}
  },
  components:{
  },
  created:function(){
    var self=this
    this.$store.dispatch('bootstrap')
    .then(()=>self.$store.dispatch('user/login'))
    .then(()=>self.$router.replace('/edit'))
    .catch(()=>self.$router.replace('/error'))
  },
  methods:{
  }
}
</script>
