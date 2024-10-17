/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang='pug'>
v-container
    v-row
      v-col
        v-card
          v-card-title.text-h4.pa-2 Export
          v-card-text.mt-5
            v-text-field(name="filename"
              label="filename"
              :rules="[rules.validJson]"
              id="filename" clearable v-model="filename" variant="underlined" color="primary" persistent-clear)
            v-text-field(name="filter"
              label="(optional) filter export by qid prefix"
              id="filter" clearable v-model="filter" variant="underlined" color="primary" persistent-clear)
          v-card-actions
            v-spacer
            v-btn(@click="start()" id="export" variant="elevated") export
    v-row
      v-col(v-if="exports.length>0")
        v-card(id="export-jobs")
          v-card-title.text-h5 Exports
          v-card-text
            v-list
              template(v-for="(job,index) in exports" :key="job.id")
                v-list-item.job-content(:id="'export-job-'+job.id" :data-status="job.status")
                  v-list-item-title {{job.id}}: {{job.status}}
                  v-list-item-subtitle
                    v-progress-linear(v-model="job.progress")
                  template(#append)
                    v-btn(icon="delete" variant="text" @click="remove(index)")
                    v-btn(v-show="job.status==='Completed'"
                      variant="text" icon="file_download" @click="download(index)" :loading="job.loading")

                v-divider(v-if="index + 1 < exports.length")
</template>

<script>

require('vuex');
const { saveAs } = require('file-saver');
const { reactive } = require('vue');

module.exports = {
    data() {
        return {
            loading: false,
            error: '',
            success: '',
            filter: '',
            filename: 'qna.json',
            exports: [],
            rules: {
                // rule javascript:S3800 - Vue validation rules expect true or string (https://vuetifyjs.com/en/components/text-fields/#validation-26-rules)
                validJson(value) { // NOSONAR-start
                    return /^([\w\d-_]+)\.json$/g.test(value) || 'Invalid JSON File Name. Only alphanumeric, hyphens and underscores are allowed.'
                },
                // NOSONAR-end
            },
        };
    },
    computed: {
    },
    components: {},
    async created() {
        this.refresh();
    },
    methods: {
        async refresh() {
            const self = this;
            const exports = await this.$store.dispatch('api/listExports');
            this.exports = exports.jobs;
            this.exports.map(async (job, index, coll) => {
                const info = await this.$store.dispatch('api/getExport', job);
                let out = {};
                Object.assign(out, coll[index], info);
                out = reactive(out);
                coll.splice(index, 1, out);
                poll();
                async function poll() {
                    const status = await self.$store.dispatch('api/getExport', job);
                    Object.assign(out, coll[index], status);
                    console.log(status.status);
                    if (status.status !== 'Completed' && status.status !== 'Error' && status.status != 'Sync Complete') {
                        setTimeout(() => poll(), 1000);
                    }
                    if (status.status == 'Completed') {
                      out.progress = 100;
                    }
                }
            });
        },
        async start() {
            // rule javascript:S5869 - Does not apply to this regex
            // NOSONAR-start
            if (!(/^([\w\d-_]+)\.json$/g.test(this.filename))) {
                return;
            }
            // NOSONAR-end
            try {
                await this.$store.dispatch('api/startExport', {
                    name: this.filename,
                    filter: this.filter,
                });
                await new Promise(resolve => setTimeout(resolve, 3000));
                await this.refresh();
            } catch (e) {
                this.error = e;
            }
        },
        async remove(index) {
            await this.$store.dispatch('api/deleteExport', this.exports[index]);
            await this.refresh();
        },
        async download(index) {
            const raw = await this.$store.dispatch('api/downloadExport', this.exports[index]);
            const blob = new Blob(
                [JSON.stringify(JSON.parse(raw), null, 2)],
                { type: 'text/plain;charset=utf-8' },
            );
            const name = this.exports[index].id;
            return Promise.resolve(saveAs(blob, name));
        },
    },
};
</script>
