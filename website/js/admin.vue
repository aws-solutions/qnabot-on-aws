<template lang='pug'>
  v-app
    v-navigation-drawer(temporary v-model="drawer" app)
      v-toolbar(flat)
        v-list
          v-list-tile
            v-list-tile-title.title Pages
      v-divider
      v-list(dense three-line subheader)
        v-list-tile(v-for="page in pages" @click="" :href="page.href") 
          v-list-tile-avatar
            v-icon(color="primary") {{page.icon}}
          v-list-tile-content
            v-list-tile-title {{page.title}}
            v-list-tile-sub-title {{page.subTitle}}
    v-toolbar(app)
      v-toolbar-side-icon(@click.stop="drawer = !drawer")
      v-toolbar-title Designer-UI: {{username}}
      v-spacer
      v-toolbar-items
        v-btn(flat 
          :href="login" 
          v-if="login") LoutOut
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
    drawer:false,
    pages:[{
      title:"Edit",
      subTitle:"edit questions and simulate responses",
      icon:"mode_edit",
      href:"#/edit"
    },{
      title:"Alexa",
      subTitle:"instructions for setting up an Alexa Skill",
      icon:"chat_bubble",
      href:"#/alexa"
    },{
      title:"Import/Export",
      subTitle:"import saved questions or download backups",
      icon:"import_export",
      href:"#import-export"
    },{
      title:"QnABot Client",
      subTitle:"Use QnABot to interact with your bot in the browser",
      icon:"chat",
      href:"client"
    }]
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


