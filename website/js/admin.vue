<template lang='pug'>
  v-app
    v-navigation-drawer(fixed temporary v-model="drawer" app)
      v-container(fill-height)
        v-layout
          v-flex
            v-list(dense)
              v-list-tile( @click="" href="#/edit") 
                v-list-tile-action edit
              v-list-tile( @click="" href="#/alexa") Alexa Instructions 
              v-list-tile( @click="" href="#/import-export") Import/Export
    v-toolbar(app)
      v-toolbar-side-icon(@click.stop="drawer = !drawer")
      v-toolbar-title Designer-UI: {{username}}
      v-spacer
      v-toolbar-items
        v-btn(flat 
          :href="login" 
          v-if="login") LoutOut
        v-btn(flat 
          :href="client" 
          v-if="client") Client
    v-container(fluid)
      v-layout(column)
        v-flex
          router-view
    v-footer
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
  data:()=>{return {
    drawer:false 
  }},
  components:{},
  computed:{
    error:function(){
      return this.$store.state.error
    },
    username:function(){
      return this.$store.state.user.name
    },
    login:function(){
      return _.get(this,"$store.state.info._links.DesignerLogin.href")
    },
    client:function(){
      return _.get(this,"$store.state.info._links.ClientLogin.href")
    }
  },
  created:function(){},
  methods:{}
}
</script>


