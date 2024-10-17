<!-- eslint-disable max-len -->
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang="pug">
v-container
    v-col
      v-card
        v-card-title
          h3 Connect Instructions
        v-card-text(class="pa-0")
          v-stepper(
            v-model="stepNumber"
            class="elevation-0"
            :items="steps"
        )
            template(#item.1)
                v-card(flat)
                    v-card-title(class="text-center") {{ steps[0].title }}
                    v-card-text(v-html="steps[0].text")
                    img(
                        v-if="steps[0].image"
                        :src="steps[0].image"
                        style="max-width:75%;display:block;margin:auto;"
                        contain
                    )
            template(#item.2)
                v-card(flat)
                    v-card-title(class="text-center") {{ steps[1].title }}
                    v-card-text(v-html="steps[1].text")
                    img(
                        v-if="steps[1].image"
                        :src="steps[1].image"
                        style="max-width:75%;display:block;margin:auto;"
                        contain
                    )
            template(#item.3)
                v-card(flat)
                  v-card-title(class="text-center") {{ steps[2].title }}
                  v-card-text(v-html="steps[2].text")
                  v-card-actions
                    img(
                        v-if="steps[2].image"
                        :src="steps[2].image"
                        style="max-width:75%;display:block;margin:auto;"
                        contain
                    )
            template(#item.4)
                v-card(flat)
                    v-card-title(class="text-center") {{ steps[3].title }}
                    v-card-text(v-html="steps[3].text")
                    v-btn(
                        :id="steps[3].buttons[0].id"
                        :loading="steps[3].buttons[0].loading"
                        @click="copy(steps[3].buttons[0])"
                    ) {{ steps[3].buttons[0].text }}
                    img(
                        v-if="steps[3].image"
                        :src="steps[3].image"
                        style="max-width:75%;display:block;margin:auto;"
                        contain
                    )
            template(#item.5)
                v-card(flat)
                    v-card-title(class="text-center") {{ steps[4].title }}
                    v-card-text(v-html="steps[4].text")
                    img(
                        v-if="steps[4].image"
                        :src="steps[4].image"
                        style="max-width:75%;display:block;margin:auto;"
                        contain
                    )
            template(#item.6)
                v-card(flat)
                    v-card-title(class="text-center") {{ steps[5].title }}
                    v-card-text(v-html="steps[5].text")
                    v-btn(
                        :id="steps[5].buttons[0].id"
                        :loading="steps[5].buttons[0].loading"
                        @click="importQuestions(steps[5].buttons[0])"
                    ) {{ steps[5].buttons[0].text }}
                    img(
                        v-if="steps[5].image"
                        :src="steps[5].image"
                        style="max-width:75%;display:block;margin:auto;"
                        contain
                    )
</template>

<script>
const Vuex = require('vuex');
const markdown = require('marked');
const axios = require('axios');

const renderer = new markdown.Renderer();
renderer.link = function (href, title, text) {
    return `<a href="${href}" title="${title}" target="_blank">${text}</a>`;
};
renderer.table = function (header, body) {
    return `<table class="pure-table"><thead>${header}</thead><tbody>${body}</tbody></table>`;
};

const handlebars = require('handlebars');
const _ = require('lodash');

module.exports = {
    data() {
        return {
            visible: false,
            stepNumber: 1,
            stepsRaw: require('./steps.js'),
        };
    },
    components: {
    },
    computed: Object.assign(
        Vuex.mapState([
            'bot',
        ]),
        {
            steps() {
                const self = this;
                return _.map(this.stepsRaw, (x) => {
                    const y = Object.assign({},x);
                    if (x.text) {
                        const temp = handlebars.compile(x.text);
                        y.text = markdown.parse(temp(self.$store.state.bot), { renderer });
                    }
                    return y;
                });
            },
        },
    ),
    methods: {
        copy(btn) {
            btn.loading = true;
            const downloadBlobAsFile = (function closureShell() {
                const a = document.createElement('a');
                return function downloadBlobAsFile(blob, filename) {
                    const objectURL = URL.createObjectURL(blob);
                    a.href = objectURL;
                    a.download = filename;
                    a.click();
                    URL.revokeObjectURL(objectURL);
                };
            }());

            this.$store.dispatch('api/getContactFlow')
                .then((result) => {
                    downloadBlobAsFile(new Blob(
                        [JSON.stringify(result.CallFlow)],
                        { type: 'text/json' },
                    ), result.FileName);
                })
                .catch((err) => console.log(err))
                .then(setTimeout(() => btn.loading = false, 1000));
        },
        importQuestions(btn) {
            const self = this;
            btn.loading = true;
            const btnImportQuestions = document.getElementById('ImportQuestions');
            const ImportQuestionsStatus = document.getElementById('ImportQuestionsStatus');
            function poll(url) {
                console.log(url);
                return self.$store.dispatch('api/getImport', { href: url })
                    .then((result) => {
                        if (result.status === 'InProgress') {
                            setTimeout(() => poll(url), 100);
                        } else {
                            return self.$store.dispatch('data/build')
                                .then(() => {
                                    btnImportQuestions.disabled = false;
                                    btnImportQuestions.style.opacity = '1';
                                    ImportQuestionsStatus.innerHTML = 'Complete';

                                    btnImportQuestions.innerHTML = 'Import Sample Questions and Answers';
                                })
                                .catch((e) => {
                                    ImportQuestionsStatus.innerHTML = `Error Rebuilding LexBot. Please return to the Content Designer, correct the errors and REBUILD LEXBOT </br> LexBot Rebuild Error ${e}`;
                                })
                                .then((result) => {
                                    btn.loading = false;
                                });
                        }
                    });
            }
            document.getElementById('stsLabel').innerHTML = 'Status:';
            ImportQuestionsStatus.innerHTML = 'Importing Questions (Step 1)...';
            self.$store.dispatch('api/getContactFlow')
                .then((result) => {
                    self.contactFlow = result;
                    ImportQuestionsStatus.innerHTML = 'Importing Questions (Step 2)...';

                    return self.$store.dispatch('api/listExamples');
                })
                .then((result) => {
                    ImportQuestionsStatus.innerHTML = 'Importing Questions (Step 3)...';
                    const exampleUrl = result.filter((example) => self.contactFlow.QnaFile === example.document.href.split('/').slice(-1)[0])[0];
                    return self.$store.dispatch('api/getImport', { href: exampleUrl.document.href });
                })
                .then((result) => {
                    ImportQuestionsStatus.innerHTML = 'Importing Questions (Step 4)...';

                    return self.$store.dispatch('api/startImport', {
                        qa: result.qna,
                        name: self.contactFlow.QnaFile,

                    });
                })
                .then((results) => {
                    ImportQuestionsStatus.innerHTML = 'Importing Questions (Step 5)...';
                    return self.$store.dispatch('api/waitForImport', { id: self.contactFlow.QnaFile });
                })
                .then((res) => {
                    console.log(JSON.stringify(res));
                    ImportQuestionsStatus.innerHTML = 'Rebuilding Lex Bot.';
                    self.pollUrl = res.href;
                    return poll(self.pollUrl);
                })
                .then(() => {});
        },
    },

};

</script>
