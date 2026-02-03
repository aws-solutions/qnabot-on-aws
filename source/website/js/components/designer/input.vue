<!-- eslint-disable max-len -->
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang="pug">
div.input
    v-text-field(
        v-if="(schema.type==='string' || schema.type==='text') && (!schema.maxLength || schema.maxLength <='5001')"
        :id="id"
        v-model="local"
        :hint="schema.description"
        persistent-hint
        :required="required"
        :rules="[rules.required,rules.schema,rules.maxLength,rules.noSpace]"
        :data-vv-name="id"
        :data-path="path"
        auto-grow
        variant="underlined"
        color="primary"
        :counter="schema.maxLength"
        persistent-counter
        validate-on="input"
        @update:error="setValid"
    )
        template(#label)
            span(v-if="required") {{ schema.title }}*
            span(v-if="!required") {{ schema.title }}
    v-textarea(
        v-if="(schema.type==='string' || schema.type==='text') && schema.maxLength>'5001'"
        :id="id"
        v-model="local"
        :hint="schema.description"
        persistent-hint
        :required="required"
        :rules="[rules.required,rules.schema,rules.maxLength]"
        :data-vv-name="id"
        :textarea="schema.maxLength>'5001'"
        :data-path="path"
        auto-grow
        variant="outlined"
        color="primary"
        :counter="schema.maxLength"
        persistent-counter
        validate-on="input"
        @update:error="setValid"
    )
        template(#label)
            span(v-if="required") {{ schema.title }}*
            span(v-if="!required") {{ schema.title }}

    v-checkbox(
        v-if="schema.type==='boolean'"
        v-model="local"
        :label="schema.title"
        :hint="schema.description"
        persistent-hint
        :required="required"
        :rules="[rules.required,rules.schema]"
        :data-path="path"
        @update:error="setValid"
    )
    div(v-if="schema.type==='array'")
        .text-subtitle-1 {{ schema.title }}
        span.text-body-2 {{ schema.description }}
        ul.pl-3
            li(
                v-for="(item,index) in modelValue"
                :key="index"
            )
                schema-input(
                    :ref="index"
                    v-model="modelValue[index]"
                    :schema="schema.items"
                    :index="index"
                    :required="index===0"
                    :name="name"
                    :path="path+'['+index+']'"
                    style="display:inline-block;width:80%;"
                    @update:valid="isValid"
                )
                v-btn.delete(
                    :id="path+'-remove-'+index"
                    icon="delete"
                    tabindex="-1"
                    variant="text"
                    @click="remove(index)"
                )
        v-btn.mb-3(
            :id="path+'-add'"
            tabindex="-1"
            @click="add"
        ) Add {{ singularTitle }}
    div(v-if="schema.type==='object'")
        .text-subtitle-1 {{ schema.title }}
        span.text-body-2(v-if="schema.description") {{ schema.description }}
        ul
            li.py-2(
                v-for="(property,index) in properties"
                :key="index"
            )
                schema-input(
                    :ref="property.name"
                    v-model="modelValue[property.name]"
                    :required="ifRequired(property.name)"
                    :schema="property"
                    :name="property.name"
                    :path="path+'.'+property.name"
                    style="margin-left:5%;"
                    @update:valid="isValid"
                )
</template>

<script>
require('vuex');
const _ = require('lodash');
const Ajv = require('ajv');
const empty = require('./empty');

const ajv = new Ajv();

module.exports = {
    props: ['schema', 'modelValue', 'required', 'name', 'index', 'path', 'pick', 'omit'],
    name: 'schema-input',
    data() {
        const self = this;
        return {
            valid: true,
            local: this.modelValue,
            rules: {
                // rule javascript:S3800 - Vue validation rules expect true or string (https://vuetifyjs.com/en/components/text-fields/#validation-26-rules)
                required(value) { // NOSONAR
                    if (typeof (value) === 'boolean') {
                        return true;
                    }
                    if (self.required) {
                        return (value?.trim ? value.trim().length > 0 : false) || 'Required';
                    }
                    return true;
                },
                schema(value) {
                    const validate = ajv.compile(self.schema || true);
                    if (validate(value)) {
                        return true;
                    }
                    // Convert AJV errors to a readable string
                    const errorMessages = validate.errors.map(err => {
                        if (err.keyword === 'maxLength') {
                            return `Maximum ${err.params.limit} characters allowed`;
                        }
                        return err.message || 'Validation error';
                    }).join(', ');
                    return errorMessages || 'Validation error';
                },
                // rule javascript:S3800 - Vue validation rules expect true or string (https://vuetifyjs.com/en/components/text-fields/#validation-26-rules)
                maxLength(value) { // NOSONAR
                    if (self.schema.maxLength && value) {
                        const length = typeof value === 'string' ? value.length : 0;
                        return length <= self.schema.maxLength || `Maximum ${self.schema.maxLength} characters allowed`;
                    }
                    return true;
                },
                // rule javascript:S3800 - Vue validation rules expect true or string (https://vuetifyjs.com/en/components/text-fields/#validation-26-rules)
                noSpace(value) { // NOSONAR
                    if (self.schema.name === 'qid') {
                        return !/\s/g.test(value) || 'No Spaces Allowed';
                    }
                    return true;
                },
            },
        };
    },
    components: {},
    watch: {
        local(v) {
            this.$emit('update:modelValue', v);
        },
        modelValue(v) {
            this.local = v;
        },

    },
    computed: {
        singularTitle() {
            const { title } = this.schema;
            const { length } = title;
            if (['s', 'S'].includes(title[length - 1])) {
                return title.slice(0, length - 1);
            }
            return title;
        },
        properties() {
            const self = this;
            if (this.schema.properties) {
                return Object.keys(this.schema.properties)
                    .filter((x) => Object.keys(self.modelValue).includes(x))
                    .filter((x) => (this.pick ? this.pick.includes(x) : true))
                    .filter((x) => (this.omit ? !this.omit.includes(x) : true))
                    .map((x) => {
                        const out = _.cloneDeep(self.schema.properties[x]);
                        out.name = x;
                        return out;
                    })
                    .sort((x, y) => _.get(x, 'propertyOrder', Number.MAX_SAFE_INTEGER) - _.get(y, 'propertyOrder', Number.MAX_SAFE_INTEGER));
            }
        },
        validate() {
            let r = this.required ? 'required' : '';
            if (this.schema.maxLength) {
                r += `|max:${this.schema.maxLength}`;
            }
            return r;
        },
        id() {
            let elementId = this.path;
            elementId = elementId.replace(/[[.]+/g, '-');
            return elementId.replace(/]+/g, '');
        },
    },
    methods: {
        remove(index) {
            this.modelValue.splice(index, 1);
        },
        add() {
            this.modelValue.push(empty(this.schema.items));
        },
        reset() {
            this.local = empty(this.schema);
        },
        ifRequired(key) {
            return this.schema.required ? this.schema.required.includes(key) : false;
        },
        isValid(value) {
            const tmp = _.flatten(_.values(this.$refs))
                .filter((x) => x.required)
                .map((x) => x.valid);

            this.valid = !tmp.includes(false) && value;
            this.$emit('update:valid', this.valid);
        },
        setValid(value) {
            this.valid = !value;
            this.$emit('update:valid', this.valid);
        },
    },
};
</script>

<style lang='scss'>
.input {
    ul {
        list-style: none;

        .delete {
            flex: 0;
        }
    }

}
</style>
