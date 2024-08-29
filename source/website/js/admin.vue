/*********************************************************************************************************************
 *  Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                                                *
 *                                                                                                                    *
 *  Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance    *
 *  with the License. A copy of the License is located at                                                             *
 *                                                                                                                    *
 *      http://www.apache.org/licenses/                                                                               *
 *                                                                                                                    *
 *  or in the 'license' file accompanying this file. This file is distributed on an 'AS IS' BASIS, WITHOUT WARRANTIES *
 *  OR CONDITIONS OF ANY KIND, express or implied. See the License for the specific language governing permissions    *
 *  and limitations under the License.                                                                                *
 *********************************************************************************************************************/
<template lang='pug'>
v-app
  v-navigation-drawer(temporary v-model="drawer" width="300")
    v-toolbar(flat)
      v-list
        v-list-item
          v-list-item-title(style="font-size: 20px !important; font-weight: 500") Tools
    v-divider
    v-list(density="compact" lines="three" v-model:opened="open")
      v-list-item(v-for="(page,key) in pages" :key="key"
        @click="drawer=false"
        :href="page.href"
        :id="'page-link-'+page.id"
        :target="page.target || '_self'")
        template(v-slot:prepend)
          v-icon.menu-icons(color="primary" :icon="page.icon")
        v-list-item-title {{page.title}}
        v-list-item-subtitle {{page.subTitle}}
      v-divider
      v-list-group(
        value="QnaHelp")
        template(#activator="{ props }")
          v-list-item( v-bind="props")
            v-list-item-title QnABot Help
            template(#prepend)
              v-icon(
                icon="info"
                color="primary"
                )
        v-list-item
          v-list-item-title Version: {{Version}}
          v-list-item-title BuildDate: {{BuildDate}}
        v-list-item
          v-list-item-title
            a(href="https://amazon.com/qnabot" target="_blank") General Instructions / QnABot Blog Post
          v-list-item-title
            a(href="https://qnabot.workshop.aws/" target="_blank") QnABot Workshop
          v-list-item-title
            a(href="https://aws.amazon.com/blogs/machine-learning/creating-virtual-guided-navigation-using-a-question-and-answer-bot-with-amazon-lex-and-amazon-alexa/" target="_blank") Guided Navigation using QnABot
          v-list-item-title
            a(href="https://aws.amazon.com/blogs/machine-learning/create-a-questionnaire-bot-with-amazon-lex-and-amazon-alexa/" target="_blank") Create a questionnaire using QnABot
          v-list-item-title
            a(href="https://aws.amazon.com/blogs/machine-learning/delight-your-customers-with-great-conversational-experiences-via-qnabot-a-generative-ai-chatbot/" target="_blank") Delight your customers with great conversational experiences via QnABot, a generative AI chatbot
  v-app-bar()
    v-app-bar-nav-icon.text-primary(id="nav-open" @click.stop="drawer = !drawer")
    v-app-bar-title
      v-breadcrumbs()
        v-breadcrumbs-item.text-primary(href='#/edit') {{$store.state.info.StackName}}:{{$store.state.user.name}}
        v-breadcrumbs-divider
        v-breadcrumbs-item(disabled) {{page}}
    v-spacer
    v-toolbar-items
      v-btn.text-primary(flat
        id="logout-button"
        @click="logout"
        v-if="login") LogOut
  v-container(fluid id="workspace")
    v-row
      v-col
        router-view
  v-footer
</template>
<script>

require('vuex');
const _ = require('lodash');

module.exports = {
    data: () => ({
        drawer: null,
        open: ["QnaHelp"],
    }),
    components: {},
    computed: {
        page() {
            return _.get(this, '$store.state.route.name', '');
        },
        error() {
            return this.$store.state.error;
        },
        username() {
            return this.$store.state.user.name;
        },
        Version() {
            return _.get(this, '$store.state.info.Version');
        },
        BuildDate() {
            return _.get(this, '$store.state.info.BuildDate');
        },
        login() {
            return _.get(this, '$store.state.info._links.DesignerLogin.href');
        },
        client() {
            return _.get(this, '$store.state.info._links.ClientLogin.href');
        },
        pages() {
            return [{
                title: 'Edit',
                id: 'edit',
                subTitle: 'Edit questions and simulate responses',
                icon: 'mode_edit',
                href: '#/edit',
            }, {
                title: 'Settings',
                id: 'settings',
                subTitle: 'View and Modify QnABot configuration settings',
                icon: 'settings',
                href: '#/settings',
            }, {
                title: 'Import',
                id: 'import',
                subTitle: 'Import new questions',
                icon: 'cloud_upload',
                href: '#/import',
            },
            {
                title: 'Export',
                id: 'export',
                subTitle: 'Download backups of your QnAs',
                icon: 'file_download',
                href: '#/export',
            }, {
                title: 'Import Custom Terminology',
                id: 'customTranslate',
                subTitle: 'Import custom translation terminology',
                icon: 'transform',
                href: '#/customTranslate',
            },
            {
                title: 'Kendra Web Crawler',
                id: 'kendraIndexing',
                subTitle: 'Crawl web pages with Kendra',
                icon: 'search',
                href: '#/kendraIndex',
            },
            {
                title: 'Alexa',
                id: 'alexa',
                subTitle: 'Instructions for setting up an Alexa Skill',
                icon: 'info',
                href: '#/alexa',
            },
            {
                title: 'Connect',
                id: 'connect',
                subTitle: 'Instructions for integrating with Connect',
                icon: 'info',
                href: '#/connect',
            },
            {
                title: 'Genesys Cloud',
                id: 'genesys',
                subTitle: 'Instructions for integrating with Genesys Cloud',
                icon: 'info',
                href: '#/genesys',
            },
            {
                title: 'Lambda Hooks',
                id: 'hooks',
                subTitle: 'Instructions for customizing QnABot behavior using AWS Lambda',
                icon: 'info',
                href: '#/hooks',
            }, {
                title: 'QnABot Client',
                id: 'client',
                subTitle: 'Use QnABot to interact with your bot in the browser',
                icon: 'forum',
                target: '_blank',
                href: _.get(this, '$store.state.info._links.ClientLogin.href'),
            }, {
                title: 'OpenSearch Dashboards',
                id: 'openSearchDashboard',
                subTitle: 'Analyze ChatBot usage',
                icon: 'show_chart',
                target: '_blank',
                href: _.get(this, '$store.state.info._links.OpenSearchDashboards.href'),
            }];
        },
    },
    created() {},
    methods: {
        logout() {
            this.$store.dispatch('user/logout');
        },
    },
};
</script>

<style lang='scss' scoped>
  #workspace {
    margin-top:60px;
  }
  .menu-icons{
    opacity: 1 !important;
  }
  .v-list-item-subtitle{
    font-size: 13px !important;
    text-overflow: initial!important;
    white-space: initial!important;
  }
  .v-list-item-title{
    font-size: 14px !important;
  }
  .v-list-group__items .v-list-item {
    --indent-padding: 0.25rem !important;
  }

  .v-list-group__items .v-list-item .v-list-item-title{
    font-size: 13px !important;
  }

</style>
