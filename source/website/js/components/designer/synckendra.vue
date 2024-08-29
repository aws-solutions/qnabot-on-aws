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
          id="kendra-sync"
          :disabled="!(kendraFaqEnabled && !loading)"
          block
          v-bind="props"
          variant="text"
          @click="start"
          ) Sync Kendra FAQ
      v-card(id="kendra-syncing")
        v-card-title Syncing: {{ request_status }}
        v-card-text
          v-list-subheader.text-error(
            v-if="error"
            id="error") {{ error }}
          v-list-subheader.text-success(
            v-if="success"
            id="success") Success!
          v-progress-linear(
            v-if="!error && !success"
            indeterminate
          )
        v-card-actions
          v-spacer
          v-btn(id="kendra-close"
            flat
            @click="cancel"
          ) Close
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
            request_status: 'Ready',
            filename: 'qna-kendra-faq.txt', // do not change because same key needed for UI status updates in lambda/export/kendraSync
            kendraFaqEnabled: false,
        };
    },
    computed: {
    },
    created() {
    },
    async mounted() {
        const settings = await this.$store.dispatch('api/listPrivateSettings');
        this.kendraFaqEnabled = !!_.get(settings, 'KENDRA_FAQ_INDEX');
    },
    methods: {
        cancel() {
            const self = this;
            self.success = false;
            self.snackbar = false;
            self.loading = false;
        },
        async refresh() {
            const self = this;
            const exports = await this.$store.dispatch('api/listExports');
            this.exports = exports.jobs;
            const info = await this.$store.dispatch('api/getExportByJobId', 'qna-kendra-faq.txt');

            if (info.status !== 'Sync Complete') {
                await poll();
            }

            async function poll() {
                // console.log('poll starting');
                // get status file
                const status = await self.$store.dispatch('api/getExportByJobId', 'qna-kendra-faq.txt');
                console.log(status.status);

                // if export status is completed, switch to running kendra sync
                if (status.status == 'Completed') status.status = 'Export finished. Running KendraSync'; // this just masks it in the UI

                self.request_status = status.status;

                // if job is not complete and not error, poll again
                if (status.status !== 'Sync Complete' && status.status !== 'Error') {
                    setTimeout(() => poll(), 1000);
                }

                if (self.request_status === 'Sync Complete') {
                    self.success = true;
                } else if (self.request_status === 'Error') {
                    self.error = 'Error!';
                }
                self.loading = false;
            }
        },
        async start() {
            this.loading = true;
            this.snackbar = true;
            this.success = false;
            this.error = '';
            this.request_status = 'Ready';
            try {
                await this.$store.dispatch('api/startKendraSyncExport', {
                    name: this.filename,
                    filter: '',
                });
                await new Promise(resolve => setTimeout(resolve, 3000));
                await this.refresh();
            } catch (e) {
                // never enters this block
            } finally {
                // never enters this block
            }
        },
    },
};
</script>

<style lang='scss' scoped>
  .refresh {
    flex:0;
  }
</style>
