<template lang="pug">
  v-container(fluid v-chosen)
    v-layout(column)
      v-flex
        v-container
          v-layout(row)
            v-flex(xs12)
              v-text-field(
                name="filter" 
                label="Filter items by ID prefix" 
                v-model="$store.state.data.filter"
                @input="filter"
                id="filter"
                clearable 
              )
            v-flex
              v-btn(@click='emit' class="ma-2 refresh" 
                :disabled="!$store.state.data.filter" 
              ) 
                span() Filter
            v-flex
              v-btn(@click='emit' class="ma-2 refresh" ) 
                span Refresh
            v-flex
              add
    v-dialog(v-model="error")
        v-card(id="error-modal")
          v-card-title(primary-title) Error Loading Content
          v-card-text
            v-subheader.error--text(v-if='error' id="add-error") {{errorMsg}}
          v-card-actions
            v-spacer
            v-btn.lighten-3(@click="error=false;errorMsg='';" :class="{ teal: success}" ) close
</template>

<script>
    /*
    Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
    SPDX-License-Identifier: Apache-2.0
    */

    var Vuex = require('vuex')
    var saveAs = require('file-saver').saveAs
    var Promise = require('bluebird')
    var _ = require('lodash')
    module.exports = {
        data: function () {
            return {
                dialog: false,
                building: false,
                success: false,
                error: false,
                errorMsg: ''
            }
        },
        components: {
            add: require('./add.vue').default,
            delete: require('./delete.vue').default
        },
        directives: {
            chosen: {
                // directive definition - this calls the emit function to request filters be reapplied to
                // the current question view. This resets any changes made in the test tab.
                inserted: (el, binding, vnode) => {
                    vnode.context.emit();
                }
            }
        },
        computed: {},
        methods: {
            filter: function (event) {
                this.emit()
            },
            emit: _.debounce(function () {
                this.$emit('filter')
            }, 100, {leading: true, trailing: false}),
            build: function () {
                var self = this
                this.building = true

                this.$store.dispatch('data/build')
                    .then(function () {
                        self.success = true
                        setTimeout(() => self.success = false, 2000)
                    })
                    .catch(e => {self.error=true; self.errorMsg = e})
                    .then(() => self.building = false)
            }
        }
    }
</script>

<style lang='scss' scoped>
    .refresh {
        flex: 0;
    }
</style>
