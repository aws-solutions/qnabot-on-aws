<template>
  <nav>
      <div class='links'>
          <span class="id" >{{$store.state.user.name}}</span>
          <router-link  to="/logout" v-show="authenticated"><span id="logout" >Log Out</span></router-link>
      </div>
      <div v-bind:class="{spinnerActive:loading}" class='spinner' ></div>
  </nav>
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

var Promise=require('bluebird')
var Vuex=require('vuex')

module.exports={
  computed:Object.assign(Vuex.mapState([
      'loading'
  ]),{
    authenticated:function(){
      return this.$store.state.user.loggedin
    }
  }),
  data:()=>({})
}
</script>

