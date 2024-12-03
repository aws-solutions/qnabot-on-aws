<!-- eslint-disable max-len -->
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang="pug">
v-dialog(
  v-model="dialog"
  persistent
  max-width="50%"
)
  template(#activator="{ props }")
    v-btn(
      block
      variant="text"
      v-bind="props"
    ) Alexa Update
  v-card(id="alexa-modal")
    v-card-title
      .text-h5 Re-configure Alexa
    v-card-text
      p You only need to update the schema of your alexa skill.
    v-card-actions
      v-btn(
        v-if="!ready"
        :loading="loading"
        @click="download"
        variant="elevated"
      ) Copy Schema
      v-btn(
        v-if="ready"
        :loading="loading"
        variant="elevated"
        @click="copy"
      ) Copy Schema
      input(
        id="alexa-schema"
        style="display:none"
        type="text"
        :value="text"
      )
    v-card-actions
      v-spacer
      v-btn(@click="dialog = false") Close
</template>

<script>

const Vuex = require('vuex');
const _ = require('lodash');

module.exports = {
    data() {
        return {
            dialog: false,
            loading: false,
            text: false,
            ready: false,
        };
    },
    components: {
    },
    computed: {

    },
    created() {
    },
    methods: {
        async download() {
            this.loading = true;
            await this.$store.dispatch('data/botinfo');
            this.text = JSON.stringify(this.$store.state.bot.alexa, null, 2);
            navigator.clipboard.writeText(this.text);
            this.ready = true;
            this.loading = false;
        },
        async copy() {
            this.loading = true;
            navigator.clipboard.writeText(this.text);
            await new Promise((res) => setTimeout(res, 1000));
            this.ready = false;
            this.loading = false;
        },
    },
};
</script>
