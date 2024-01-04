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
<template lang="pug">
span(class="wrapper")
  v-dialog(
    v-model="snackbar"
    persistent
  )
    template(#activator="{ props }")
      v-btn(
        id="lex-rebuild"
        :disabled="loading"
        block
        variant="text"
        v-bind="props"
        @click="build"
      ) Lex Rebuild
    v-card(id="lex-loading")
      v-card-title Rebuilding  : {{status}}
      v-card-text
        v-list-subheader.text-error(v-if='error' id="lex-error") {{error}}
        v-list-subheader.text-success(v-if='success' id="lex-success") Success!
        v-list-subheader.text-error(v-if='message' ) {{message}}
        v-progress-linear(v-if='!error && !success' indeterminate)
      v-card-actions
        v-spacer
        v-btn(@click='cancel' flat id="lex-close") close
</template>

<script>

require('vuex');
const _ = require('lodash');

module.exports = {
    data() {
        return {
            snackbar: false,
            loading: false,
            success: false,
            error: '',
        };
    },
    computed: {
        status() {
            return _.get(this, '$store.state.bot.status', 'Ready');
        },
        message() {
            return _.get(this, '$store.state.bot.build.message');
        },
    },
    methods: {
        cancel() {
            const self = this;
            self.success = false;
            self.snackbar = false;
        },
        build() {
            const self = this;
            this.loading = true;
            this.snackbar = true;
            this.success = false;
            this.error = false;
            this.$store.dispatch('data/build')
                .then(() => {
                    self.success = true;
                })
                .catch((e) => self.error = e)
                .then(() => self.loading = false);
        },
    },
};
</script>

<style lang='scss' scoped>
  .refresh {
    flex:0;
  }
</style>
