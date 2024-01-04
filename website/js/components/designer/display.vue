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
span
  span(v-if="schema.type==='string' && !empty")
    v-container.pa-0.fluid
      v-row
        v-col
          .text-h6 {{ schema.title }}
          span.pl-3(:data-path="path") {{ modelValue }}
  span(v-if="schema.type==='number' && !empty")
    v-container.pa-0.fluid
      v-row
        v-col
          .text-h6 {{ schema.title }}
          span.pl-3( :data-path="path" ) {{modelValue}}
  span(v-if="schema.type==='array' && !empty")
    v-container.fluid.pa-0
      v-row
        v-col
          display(
            v-for="(item,index) in modelValue"
            :schema="schema.items"
            :modelValue="item"
            :path="path+'['+index+']'"
          )
  span(v-if="schema.type==='object' && !empty")
    v-container.fluid
      v-row
        .text-h6 {{ schema.title }}
        template(v-for="(property,key) in schema.properties")
          v-col(v-if="modelValue[key]")
            display(
              :path="path+'.'+key"
              :name="key"
              column
              :schema="schema.properties[key]"
              :modelValue="modelValue[key]"
            )
</template>

<script>
require('vuex');
const _ = require('lodash');
require('./empty');

module.exports = {
    props: ['schema', 'modelValue', 'name', 'row', 'column', 'path'],
    name: 'display',
    data() {
        return {};
    },
    components: {},
    computed: {
        empty() {
            if (this.schema.type === 'array') {
                return this.modelValue.length === 0;
            }
            if (this.schema.type === 'object') {
                return !_.values(this.modelValue).map((x) => !!x).includes(true);
            }
            return !this.modelValue;
        },
        properties() {
            const self = this;
            function helperSort(nextDepth) {
                return Object.keys(nextDepth)
                    .filter((x) => Object.keys(self.modelValue).includes(x))
                    .map((x) => {
                        const out = _.cloneDeep(nextDepth[x]);
                        out.name = x;
                        return out;
                    })
                    .sort((x, y) => _.get(x, 'propertyOrder', Number.MAX_SAFE_INTEGER) - _.get(y, 'propertyOrder', Number.MAX_SAFE_INTEGER));
            }
            function recurseDown(currentDepth) {
                if (_.has(currentDepth, 'properties')) {
                    for (const key in Object.keys(currentDepth.properties)) {
                        recurseDown(key);
                    }
                    return helperSort(currentDepth.properties);
                }
                if (_.has(currentDepth, 'items.properties')) {
                    for (const key in Object.keys(currentDepth.items.properties)) {
                        recurseDown(key);
                    }
                    return helperSort(currentDepth.properties);
                }
                return currentDepth;
            }
            if (this.schema.properties) {
                return recurseDown(this.schema);
            }
        },
    },
    methods: {
    },
};
</script>
