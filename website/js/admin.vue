<template lang='pug'>
  v-app
    v-navigation-drawer(temporary v-model="drawer" app)
      v-toolbar(flat)
        v-list
          v-list-tile
            v-list-tile-title.title Tools
      v-divider
      v-list(dense three-line subheader)
        v-list-tile(v-for="(page,key) in pages" :key="key"
          @click="" 
          :href="page.href"
          :target="page.target || '_self'") 
          v-list-tile-avatar
            v-icon(color="primary") {{page.icon}}
          v-list-tile-content
            v-list-tile-title {{page.title}}
            v-list-tile-sub-title {{page.subTitle}}
    v-toolbar(app)
      v-toolbar-side-icon(
        id="nav-open"
        @click.stop="drawer = !drawer"
      )
      v-toolbar-title 
        v-breadcrumbs
          v-breadcrumbs-item(href='#/edit') QnABot-Designer-UI:{{$store.state.user.name}}
          v-breadcrumbs-item {{page}}
      v-spacer
      v-toolbar-items
        v-btn(flat 
          id="logout-button"
          :href="login" 
          v-if="login") LogOut
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
  data:()=>{
    return {
    drawer:false
  }},
  components:{},
  computed:{
    page:function(){
      return _.get(this,'$store.state.route.name','')
    },
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
    },
    pages:function(){
      return [{
        title:"Edit",
        subTitle:"edit questions and simulate responses",
        icon:"mode_edit",
        href:"#/edit"
      },{
        title:"Alexa",
        subTitle:"instructions for setting up an Alexa Skill",
        icon:"info",
        href:"#/alexa"
      },{
        title:"Lambda Hooks",
        subTitle:"Instructions for customizing QnABot behavior using AWS Lambda",
        icon:"settings_input_component",
        href:"#/hooks"
      },{
        title:"Import",
        subTitle:"Import new questions",
        icon:"cloud_upload",
        href:"#/import"
      },{
        title:"Export",
        subTitle:"Download backups of your QnAs",
        icon:"file_download",
        href:"#/export"
      },{
        title:"QnABot Client",
        subTitle:"Use QnABot to interact with your bot in the browser",
        icon:"forum",
        target:'_blank',
        href:_.get(this,"$store.state.info._links.ClientLogin.href")
      }]
    }
  },
  created:function(){},
  methods:{}
}
</script>


