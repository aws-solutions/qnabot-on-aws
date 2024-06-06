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
 // To Do L 83
<template lang="pug">
span(class="wrapper")
  v-dialog(
    v-model="loading"
    persistent
    max-width="60%"
  )
    v-card
      v-card-title Creating {{ data.qid }}
      v-card-text.my-3
        v-list-subheader.text-error(
          v-if="error"
          id="add-error"
        ) {{ error }}
        v-list-subheader.text-success(
          v-if="success"
          id="add-success"
        ) {{ success }}
        v-progress-linear(
          v-if="!error && !success"
          indeterminate
        )
      v-card-actions
        v-spacer
        v-btn.font-weight-bold(
          id="add-close"
          flat
          @click="cancel"
        ) close
  v-dialog(
    ref="dialog"
    v-model="dialog"
    persistent
    max-width="60%"
  )
    template(v-slot:activator="{ props }")
      v-btn.ma-2(
        id="add-question-btn"
        v-bind="props"
        @click="reset"
      ) Add
    v-card(id="add-question-form")
      v-card-title
        .text-h5 {{ title }}
      v-card-text.pb-0
        .text-h6 Document Type
        v-radio-group(
          v-model="type"
          inline
          color="accent"
        )
          v-radio.mr-8(
            v-for="t in types"
            :key="t"
            :label="t"
            :value="t"
          )
      v-card-text.pt-0
        v-form(v-if="dialog")
          schema-input(
            ref="requiredInput"
            v-model="data[type]"
            v-model:valid="valid.required"
            :schema="schema"
            :pick="required"
            :path="type"
          )
          v-expansion-panels
            v-expansion-panel.mt-3(elevation="0" )
              v-expansion-panel-title Advanced
              v-expansion-panel-text
                schema-input(
                  ref="optionalInput"
                  v-model="data[type]"
                  v-model:valid="valid.optional"
                  :schema="schema"
                  :omit="schema.required"
                  :path="type"
                )
        small * indicates required field
        v-list-subheader.text-error(v-if="error") {{ error }}
      v-card-actions
        v-spacer
        v-btn(
          id="add-question-cancel"
          @click="cancel"
        ) Cancel
        v-btn(
          id="add-question-submit"
          :disabled="!valid"
          @click="add"
        ) Create
</template>

<script>

require('vuex');
const _ = require('lodash');
const Ajv = require('ajv');
const empty = require('./empty');
const sanitizeHtml = require('sanitize-html');

const ajv = new Ajv();

module.exports = {
    data() {
        return {
            title: 'Add New Item',
            error: '',
            success: '',
            type: 'qna',
            dialog: false,
            loading: false,
            valid: {
                required: false,
                optional: false,
            },
            data: {},
        };
    },
    components: {
        'schema-input': require('./input.vue').default,
    },
    computed: {
        types() {
            return Object.keys(this.$store.state.data.schema).sort();
        },
        schema() {
            return _.get(this, `$store.state.data.schema[${this.type}]`, { type: 'object' });
        },
        required() {
            return _.get(this, 'schema.required', []);
        },
    },
    methods: {
        cancel() {
            this.reset();
            this.loading = false;
            this.dialog = false;
            this.error = false;
        },
        reset() {
            this.data = _.mapValues(this.$store.state.data.schema, (value, key) => empty(value));
        },
        validate() {
            return !!validate(value) || validate.errors.map((x) => x.message).join('. ');
        },
        async add() {
            const self = this;
            this.error = false;
            const data = sanitize(clean(_.cloneDeep(this.data[this.type])), this.type);
            const validate = ajv.compile(this.schema || true);
            console.log(data);
            const valid = validate(data);

            if (valid) {
                this.loading = true;
                this.dialog = false;
                try {
                    const exists = await this.$store.dispatch('api/check', data.qid);
                    if (exists) {
                        self.error = 'Question already exists';
                        self.loading = false;
                        self.dialog = true;
                    } else {
                        data.type = this.type;
                        await self.$store.dispatch('data/add', data);
                        self.success = 'Success!';
                        self.$store.commit('data/addQA', _.cloneDeep(data));
                        self.reset();
                    }
                } catch (e) {
                    console.log(e);
                    self.error = e;
                }
            } else {
                const err = validate.errors.map((x) => x.message).join('. ');
                this.error = (err.startsWith('should match pattern')) ? 'No Spaces Allowed in Intent ID' : err;
            }
        },
    },
};

function clean(obj) {
    if (Array.isArray(obj)) {
        for (let i = 0; i < obj.length; i++) {
            obj[i] = clean(obj[i]);
        }
        const out = _.compact(obj);
        return out.length ? out : null;
    }
    if (typeof obj === 'object') {
        for (const key in obj) {
            obj[key] = clean(obj[key]);
        }
        const out = _.pickBy(obj);
        return _.keys(out).length ? out : null;
    }
    if (obj.trim) {
        return obj.trim() || null;
    }
    return obj;
}

function sanitize(data, type) {
    const sanitizedData = { ...data };
    if (type === 'qna' && sanitizedData.alt?.markdown) {
        sanitizedData.alt.markdown = sanitizeHtml(sanitizedData.alt.markdown, {
            allowedTags: sanitizeHtml.defaults.allowedTags.concat(['iframe']),
            allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, iframe: ['src'] },
        });
        sanitizedData.alt.markdown = sanitizedData.alt.markdown.replace('&gt;', '>');
    }
    if (type === 'text' && sanitizedData.passage) {
        sanitizedData.passage = sanitizeHtml(sanitizedData.passage);
    }
    return sanitizedData;
}
</script>

<style lang='scss' scoped>
  .wrapper {
    display:inline-block;
  }
</style>
