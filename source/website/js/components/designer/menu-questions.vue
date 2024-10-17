/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang="pug">
v-container(fluid)
  v-row.mx-5(align="center"
        align-content="center")
    v-col.pr-0(cols="6")
      v-text-field(
        id="filter"
        v-model="$store.state.data.filter"
        name="filter"
        label="Filter items by ID prefix"
        variant="underlined"
        color="primary"
        clearable
        persistent-clear
        prepend-inner-icon="search"
        @input="filter"
        @click:clear="filter"
      )
    v-col.pl-2()
      div(class="d-flex flex-row")
        v-btn(
          class="ma-2 refresh"
          @click="refresh"
        )
          span Refresh
        add
  v-dialog(v-model="error")
      v-card(id="error-modal")
        v-card-title(primary-title) Error Loading Content
        v-card-text
          v-list-subheader.text-error(v-if='error' id="add-error") {{errorMsg}}
        v-card-actions
          v-spacer
          v-btn.lighten-3(@click="error=false;errorMsg='';" :class="{ teal: success}" ) close
</template>

<script>

require('vuex');
require('file-saver');
const _ = require('lodash');

module.exports = {
    data() {
        return {
            dialog: false,
            building: false,
            success: false,
            error: false,
            errorMsg: '',
            search: '',
        };
    },
    components: {
        add: require('./add.vue').default,
    },
    directives: {
        chosen: {
            // directive definition - this calls the emit function to request filters be reapplied to
            // the current question view. This resets any changes made in the test tab.
            inserted: (el, binding, vnode) => {
                vnode.context.emit();
            },
        },
    },
    computed: {},
    methods: {
        filter() {
            this.emit();
        },
        refresh() {
          this.$emit('refresh');
        },
        emit: _.debounce(function () {
            this.$emit('filter');
        }, 100, { leading: true, trailing: false }),
        build() {
            const self = this;
            this.building = true;

            this.$store.dispatch('data/build')
                .then(() => {
                    self.success = true;
                    setTimeout(() => self.success = false, 2000);
                })
                .catch((e) => { self.error = true; self.errorMsg = e; })
                .then(() => self.building = false);
        },
    },
};
</script>
