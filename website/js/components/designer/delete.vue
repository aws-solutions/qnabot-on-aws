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
  v-dialog(v-model="loading" persistent id="delete-loading")
    v-card
      v-card-title Deleting
      v-card-text(v-if="!selectAll")
        ul
          li(v-for="id in ids") {{id}}
      v-card-text
        v-list-subheader.text-error(v-if='error' id="delete-error") {{error}}
        v-list-subheader.text-success(v-if='success' id="delete-success") {{success}}
        v-progress-linear(v-if='!error && !success' indeterminate)
      v-card-actions
        v-spacer
          v-btn(@click='cancel' flat) close
  v-dialog(persistent v-model='dialog' max-width='60%')
    template(v-slot:activator="{ props }")
      v-btn(variant="text" v-bind="props" icon="delete")
    v-card(title="Delete Selection")
      v-card-text
        span(v-if="!selectAll")
          p Are you sure you want to delete the following QnAs:
          ul.my-3
            li(v-for="qa in QAs") {{qa.qid}}
        span(v-if="selectAll && !filter")
            p Are you sure you want to delete all QnAs
        span(v-if="selectAll && filter")
            p Are you sure you want to delete all QnAs with prefix:
            p {{filter}}
      v-card-actions
        v-spacer
        v-btn(@click='cancel') Cancel
        v-btn(@click="rm" id="confirm-delete") Delete
</template>

<script>

require('vuex');

module.exports = {
    props: ['data', 'selectAll', 'selected'],
    data() {
        return {
            error: '',
            success: '',
            dialog: false,
            loading: false,
            total: 0,
            ids: [],
        };
    },
    components: {
    },
    computed: {
        QAs() {
            return this.data ? [this.data] : this.$store.state.data.QAs.filter((x) => x.select);
        },
        filter() {
            return this.$store.state.data.filter;
        },
    },
    methods: {
        cancel() {
            this.dialog = false;
            this.loading = false;
            this.error = false;
        },
        rm() {
          this.dialog = false;
          this.$emit('handleDelete', this.QAs);
        },
    },
};
</script>

<style lang='scss' scoped>
  .wrapper {
    display:inline-block;
  }
</style>
