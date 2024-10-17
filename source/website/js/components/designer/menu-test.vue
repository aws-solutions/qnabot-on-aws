/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang="pug">
v-container(fluid)
  v-row
    v-col
      v-text-field(
        id="query"
        v-model="query"
        name="query"
        label="Type your question here"
        clearable
        color="primary"
        variant="underlined"
        persistent-clear
        @keyup.enter="simulate"
      )
    v-col
      v-select(
        v-model="score_on"
        label="Match on:"
        :items="['qna item questions', 'qna item answer', 'text item passage']"
        bg-color="none"
        color="primary"
        density="comfortable"
      )
  v-row
    v-col
      v-text-field(
        name="topic"
        label="(optional) Topic context"
        id="topic"
        v-model="topic"
        @keyup.enter="simulate"
        clearable
        color="primary"
        variant="underlined"
        persistent-clear
      )
    v-col
      v-btn(
          id="query-test"
          @click="simulate"
        ) Search
  v-row
    v-col(cols="6")
      v-text-field(
        name="client_filter"
        label="(optional) Client filter context"
        id="client_filter"
        v-model="client_filter"
        @keyup.enter="simulate"
        clearable
        color="primary"
        variant="underlined"
        persistent-clear
      )
</template>

<script>

require('vuex');
const _ = require('lodash');

module.exports = {
    data() {
        return {
            query: '',
            topic: '',
            client_filter: '',
            score_on: 'qna item questions',
        };
    },
    components: {
    },
    computed: {},
    methods: {
        simulate: _.debounce(function () {
            return this.$store.dispatch('data/search', {
                query: this.query,
                topic: this.topic,
                client_filter: this.client_filter,
                score_answer: this.score_answer,
                score_on: this.score_on,
            });
        }, 500, { trailing: false, leading: true }),
    },
};
</script>
<style>
  .v-row {
    margin-top: 0px !important;
    margin-bottom: 0px !important;

  }
</style>
