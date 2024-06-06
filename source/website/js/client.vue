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
div(id="qna-client")
  lex-web-ui
</template>

<script>
module.exports = {
    data: () => ({}),
    components: {},
    computed: {
    },
    methods: {},
};
</script>

<style lang='scss'>
  #lex-web > nav {
    display:none;
  }
  nav {
    z-index:1;
  }
  .v-toolbar.v-toolbar--density-default.bg-cyan {
    color:white !important;
  }
</style>
