/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang='pug'>
v-card(flat class="pa-0")
  .text-error(v-if="!data") No data provided
  .text-error(v-else-if="!schema || Object.keys(schema).length === 0") Schema not loaded (type: {{ type }})
  span(v-else)
    span(v-show="false" :data-path="data.qid+'-.qid'") {{data.qid}}
    display(
        :schema="schema"
        :path='data.qid+"-"'
        row
        v-model="topitems"
    )
    v-divider(v-if="extra")
    display(
        v-if="extra"
        :schema="schema"
        :path='data.qid+"-"'
        column
        v-model="bottomitems"
    )
</template>

<script>
import Vuex from 'vuex';
import _ from 'lodash';
import display from './display.vue';

export default {
    props: ['data'],
    data: () => ({
        advanced: false,
        top: ['q', 'a'],
    }),
    components: {
        display,
    },
    computed: {
        type() {
            return this.data.type || 'qna';
        },
        schema() {
            const schema = this.$store.state.data.schema[this.type];
            return schema || {};
        },
        extra() {
            return _.values(_.pick(this.items, this.top)).length > 0;
        },
        items() {
            return _.omit(this.data, ['qid']);
        },
        topitems() {
            if (this.type === 'qna') {
                return _.pick(this.items, this.top);
            }
            return this.items;
        },
        bottomitems() {
            if (this.type === 'qna') {
                return _.omit(this.items, this.top);
            }
            return {};
        },
    },
    methods: {},
};
</script>

<style lang='scss' scoped>
  ul {
    list-style:none;
  }
</style>
