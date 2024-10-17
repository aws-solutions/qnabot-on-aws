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
                h3 Lambda Hook Instructions
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
                        v-card-actions
                            v-btn(
                                :id="steps[0].buttons[0].id"
                                :loading="steps[0].buttons[0].loading"
                                @click="copy(steps[0].buttons[0])"
                            ) {{ steps[0].buttons[0].text }}
                template(#item.2)
                    v-card(flat)
                        v-card-title(class="text-center") {{ steps[1].title }}
                        v-card-text(v-html="steps[1].text")
                        v-card-actions
                            template(
                                v-for="(button,index) in steps[1].buttons"
                                :key="index"
                            )
                                v-btn(
                                    :id="button.id"
                                    :loading="button.loading"
                                    @click="copy(button)"
                                ) {{ button.text }}
                template(#item.3)
                    v-card(flat)
                        v-card-title(class="text-center") {{ steps[2].title }}
                        v-card-text(v-html="steps[2].text")
                template(#item.4)
                    v-card(flat)
                        v-card-title(class="text-center") {{ steps[3].title }}
                        v-card-text(v-html="steps[3].text")
</template>

<script>

import hljs from 'highlight.js/lib/core';
import javascriptlang from 'highlight.js/lib/languages/javascript';
import pythonlang from 'highlight.js/lib/languages/python';
import jsonlang from 'highlight.js/lib/languages/json';

const Vuex = require('vuex');
const markdown = require('marked');

hljs.registerLanguage('javascript', javascriptlang);
hljs.registerLanguage('python', pythonlang);
hljs.registerLanguage('json', jsonlang);

markdown.setOptions({
    highlight(code) {
        return hljs.highlightAuto(code).value;
    },
});
const renderer = new markdown.Renderer();
renderer.link = function (href, title, text) {
    return `<a href="${href}" title="${title}" target="_blank">${text}</a>`;
};
const handlebars = require('handlebars');
const _ = require('lodash');
const stringify = require('json-stringify-pretty-compact');
const codeJS = require('./codejs.txt');
const codePY = require('./codepy.txt');
const example = stringify(require('./example'));

export default {
    components: {
    },
    data() {
        return {
            visible: false,
            stepNumber: 1,
            prefix: 'qna',
            stepsRaw: require('./steps.js'),
        };
    },
    computed:
        Object.assign(
            Vuex.mapState([
                'bot',
            ]),

            {
                steps() {
                    const self = this;
                    return _.map(this.stepsRaw, (x) => {
                        const temp = handlebars.compile(x.text);
                        const y = Object.assign({},x);
                        y.text = markdown.parse(temp(self.$store.state.bot), { renderer });
                        return y;
                    });
                },
            },
        ),
    methods: {
        copy(btn) {
            btn.loading = true;
            if (btn.id === 'Role') {
                this.$store.dispatch('data/botinfo')
                    .catch(() => console.log('Could not retrieve bot info'))
                    .then(() => navigator.clipboard.writeText(`${this.$store.state.bot.lambdaRole}`)
                        .then(() => {
                            btn.loading = false;
                        })
                        .catch((err) => console.log(err))
                    )
            } else if (btn.id === 'code-js') {
                navigator.clipboard.writeText(codeJS)
                    .catch((err) => console.log(err))
                    .then(setTimeout(() => btn.loading = false, 1000));
            } else if (btn.id === 'code-py') {
                navigator.clipboard.writeText(codePY)
                    .catch((err) => console.log(err))
                    .then(setTimeout(() => btn.loading = false, 1000));
            } else {
                navigator.clipboard.writeText(example)
                    .catch((err) => console.log(err))
                    .then(setTimeout(() => btn.loading = false, 1000));
            }
        },
    },
};
</script>
