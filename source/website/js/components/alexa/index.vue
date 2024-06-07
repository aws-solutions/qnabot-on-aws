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
v-container
    v-col
      v-card
        v-card-title
          h3 Alexa Instructions
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
                    @click="copy(steps[5].buttons[0])"
                  ) {{ steps[5].buttons[0].text }}
                  br
                  br
                  img(
                    v-if="steps[5].image"
                    :src="steps[5].image"
                    style="max-width:75%;display:block;margin:auto;"
                    contain
                  )
            template(#item.7)
              v-card(flat)
                v-card-title(class="text-center") {{ steps[6].title }}
                v-card-text(v-html="steps[6].text")
                v-btn(
                  :id="steps[6].buttons[0].id"
                  :loading="steps[6].buttons[0].loading"
                  @click="copy(steps[6].buttons[0])"
                ) {{ steps[6].buttons[0].text }}
                br
                br
                img(
                  v-if="steps[6].image"
                  :src="steps[6].image"
                  style="max-width:75%;display:block;margin:auto;"
                  contain
                )
            template(#item.8)
              v-card(flat)
                v-card-title(class="text-center") {{ steps[7].title }}
                v-card-text(
                  class="text-wrap"
                  v-html="steps[7].text"
                )
                img(
                  v-if="steps[7].image"
                  :src="steps[7].image"
                  style="max-width:75%;display:block;margin:auto;"
                  contain
                )
</template>

<script>

const Vuex = require('vuex');
const markdown = require('marked');

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
                const self = this;
                return _.map(this.stepsRaw, (x) => {
                    const y = { ...x };
                    if (x.text) {
                        const temp = handlebars.compile(x.text);
                        y.text = markdown.parse(temp(self.$store.state.bot), { renderer });
                    }
                    return y;
                });
            },
        },
    ),
    created() {
        this.$store.dispatch('data/botinfo').catch(() => null);
    },
    methods: {
        copy(btn) {
            btn.loading = true;

            if (btn.id === 'LambdaArn') {
                navigator.clipboard.writeText(this.$store.state.bot.lambdaArn)
                    .catch((err) => console.log(err))
                    .then(setTimeout(() => btn.loading = false, 1000));
            } else {
                navigator.clipboard.writeText(JSON.stringify(this.$store.state.bot.alexa, null, 2))
                    .catch((err) => console.log(err))
                    .then(setTimeout(() => btn.loading = false, 1000));
            }
        },
    },
};
</script>
