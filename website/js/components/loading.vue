<template lang='pug'>
  v-card
    v-progress-linear(indeterminate)
</template>

<script>
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

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
    .tapCatch(console.log)
    .catch(()=>self.$router.replace('/error'))
  },
  methods:{
  }
}
</script>
