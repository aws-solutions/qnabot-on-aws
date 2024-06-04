<!-- eslint-disable max-len -->
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
v-container(id="page-import")
    v-col
      v-card
        v-card-title.text-h4.pa-6 Import Translate Custom Terminologies
        v-card-text.pb-0.pl-6.pr-6
          h3 For more information about Amazon Translate custom terminologies, see <!-- NOSONAR-start --><!-- This link is safe --><a href="https://github.com/aws-solutions/qnabot-on-aws/blob/main/docs/custom_terminology_guide/README.md" target="_blank">here</a><!-- NOSONAR-end -->
        v-card-text(v-if="!IsCustomTerminologyEnabled")
          p Set ENABLE_CUSTOM_TERMINOLOGY to true in settings to enable the use of terminology files for Amazon Translate
        v-card-text.pl-6.pr-6(v-if="IsCustomTerminologyEnabled")
            em {{ importWarning }}
            br
            br
            h3 From File
            br
            div.ml-4.mb-2
                input(
                id="upload-file"
                ref="file"
                type="file"
                name="file"
                @change="Getfile"
                )
            p {{ uploadStatus }}
            br
            h4 Description:
            v-textarea(
                v-model="description"
                placeholder="Give a description for your file."
                variant="outlined"
                color="cyan"
            )
        v-card.pa-4(
            v-if="jobs.length>0 && IsCustomTerminologyEnabled"
            id="import-jobs"
        )
            v-card-title Installed Translate Custom Terminologies
            v-card-text
                v-table
                    thead
                        tr
                            th(style="text-align:left") Name
                            th(style="text-align:left") Description
                            th(style="text-align:left") Source Language
                            th(style="text-align:left") Target Languages
                            th(style="text-align:left") Number Of Terms
                    tbody
                        tr(
                            v-for="(job,index) in jobs"
                            :key="index"
                        )
                            td {{ job.Name }}
                            td {{ job.Description }}
                            td {{ job.SourceLanguage }}
                            td {{ job.TargetLanguageCodes.join() }}
                            td {{ job.TermCount }}

</template>

<script>
require('vuex');
require('axios');
require('json-parse-better-errors');

const _ = require('lodash');

module.exports = {
    data() {
        return {
            importWarning: 'Warning: Importing will over write existing translations with the same ID',
            loading: false,
            testing: false,
            url: '',
            error: '',
            success: '',
            description: null,
            jobs: [],
            examples: [],
            uploadStatus: '',
            IsCustomTerminologyEnabled: false,

        };
    },
    components: {
    },
    computed: {
    },
    mounted() {
        const self = this;
        if (!self.IsCustomTerminologyEnabled) {
            self.CustomTerminologyIsEnabled()
                .then((data) => {
                    self.IsCustomTerminologyEnabled = data;
                });
        }
    },
    async created() {
        this.refresh();
        const examples = await this.$store.dispatch('api/listExamples');
        this.examples = examples;
    },
    methods: {
        async CustomTerminologyIsEnabled() {
            const settings = await this.$store.dispatch('api/listSettings');
            console.log(JSON.stringify(settings));
            return _.get(settings[2], 'ENABLE_CUSTOM_TERMINOLOGY') == 'true';
        },

        close() {
            this.loading = false;
            this.error = false;
        },

        refresh(index) {
            const self = this;
            if (index === undefined) {
                self.jobs = [];
                return this.$store.dispatch('api/getTerminologies')
                    .then((result) => {
                        self.jobs = result;
                    });
            }
        },
        Getfile(event) {
            const self = this;
            this.loading = true;
            const rawFiles = self.$refs.file.files;
            const files = [];
            for (const rawFile of rawFiles) {
                files.push(rawFile);
            }
            Promise.all(files.map((file) => new Promise((res, rej) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    try {
                        res({
                            name: file.name,
                            data: e.target.result,
                        });
                    } catch (e) {
                        rej(e);
                    }
                };
                reader.readAsText(file);
            })))
                .then((results) => {
                    results.forEach((result) => self.upload(result.data, result.name));
                })
                .catch((e) => {
                    console.log(e);
                    self.error = e.message;
                });
        },
        upload(data, nam) {
            const self = this;
            console.log('data:', data);
            new Promise((res, rej) => {
                console.log(data);
                if (data) {
                    self.$store.dispatch('api/startImportTranslate', {
                        name: nam.split('.')[0],
                        description: self.description,
                        file: window.btoa(data),
                    })
                        .then(res)
                        .catch(rej);
                } else {
                    rej('Invalid or Empty File');
                }
            })
                .then((data) => {
                    self.uploadStatus = `Status: ${data.Status}:${data.Error}`;
                    self.refresh();
                })
                .catch((error) => {
                    console.log(error);
                    self.error = error;
                });
        },
    },
};
</script>

<style lang='scss' scoped>
  .job-content {
    flex:1;
  }

  .job-actions {
    flex:0;
    flex-direction:row;
  }
</style>
