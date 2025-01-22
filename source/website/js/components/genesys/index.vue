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
        h3 Genesys Cloud CX Instructions
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
              v-card-actions
                v-btn(
                    :id="steps[3].buttons[0].id"
                    :loading="steps[3].buttons[0].loading"
                    @click="copy(steps[3].buttons[0])"
                ) {{ steps[3].buttons[0].text }}
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
              img(
                  v-if="steps[5].image"
                  :src="steps[5].image"
                  style="max-width:75%;display:block;margin:auto;"
                  contain
                )
</template>

<script>

const Vuex = require('vuex');
const _ = require('lodash');

module.exports = {
    data() {
        return {
            visible: false,
            stepNumber: 1,
            stepsRaw: require('./steps'),
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
                return _.map(this.stepsRaw, (x) => {
                    const y = { ...x };
                    return y;
                });
            },
        },
    ),
    updated() {
        const self = this;
        this.$nextTick(() => {
            const spanBot = document.getElementById('spnBotname');
            if (spanBot) {
                self.$store.dispatch('api/botinfo').then((result) => spanBot.innerText = result.lexV2botname);
            }
        });
    },

    created() {
        this.$store.dispatch('data/botinfo').catch(() => null);
    },
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

            this.$store.dispatch('api/getGenesysCallFlow')
                .then((result) => {
                    downloadBlobAsFile(new Blob(
                        [result],
                        { type: 'text/yaml' },
                    ), 'QnABotFlow.yaml');
                })
                .catch((err) => console.log(err))
                .then(setTimeout(() => btn.loading = false, 1000));
        },
    },

};

</script>
