<!-- eslint-disable max-len -->
/** ************************************************************************************************
*   Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.                             *
*   SPDX-License-Identifier: Apache-2.0                                                            *
 ************************************************************************************************ */
<template lang="pug">
v-card.root-card
  v-card-title.pa-0.bg-cyan
    v-layout(row)
      v-tabs.tabs__item(
        v-model="active"
        slider-color="accent"
      )
        v-tab.text-h6(
          id="questions-tab"
          ripple
          value="questions"
        ) QUESTIONS
        v-tab.text-h6(
          id="test-tab"
          ripple
          value="test"
        ) TEST
        v-tab.text-h6(
          id="testAll-tab"
          ripple
          value="testAll"
        ) TEST ALL
      v-spacer
      v-menu(
        location="bottom"
      )
        template(#activator="{ props }")
          v-btn.icon-button.text-white(
            id="edit-sub-menu"
            v-bind="props"
            icon
          )
            v-icon more_vert
        v-list
          v-list-item
            alexa
          v-list-item
            build
          v-list-item
            sync

  span
    questions(
      v-if="active==='questions'"
      @filter="get()"
      @refresh="refresh()"
    )
    test(v-if="active==='test'")
    testAll(v-if="active==='testAll'")
  v-data-table-server(
    v-if="active!=='testAll'"
    v-model:items-per-page="itemsPerPage"
    v-model:expanded="expanded"
    :headers="headers"
    :items="QAs"
    :search="search"
    :items-length="total"
    :items-per-page-options="perpage"
    :sort-by="sortBy"
    :loading="loading"
    item-value="qid"
    color="primary"
    must-sort
    @update:options="loadItems"
  )
    template(#headers="{columns, getSortIcon, toggleSort}")
      tr
        th.shrink.text-h6(v-if="active==='test'") score
        template(
          v-for="column in columns"
          :key="column.key")
          th.shrink(
            v-if="active==='questions' && column.title==='SelectAll'"
            id="select-all"
          )
            v-checkbox(
              v-model="selectAll"
              :indeterminate="QAs.length===0"
              tabindex="-1"
              color="primary"
              @change="toggleSelectAll"
            )
          th.text-xs-left.text-h6(
            v-if="column.title !=='SelectAll' && column.title !=='RowOptions'"
            :key="column.title"
            :class="['column', column.sortable ? 'sortable' : '']")
            span(
              class="mr-2 cursor-pointer"
              @click="column.sortable && toggleSort(column)"
              ) {{ column.title }}
            v-icon(
                  v-if="active==='questions' && column.sortable"
                  size="small"
                  :icon="getSortIcon(column)"
                )
          th.flex-grow-1.pa-0(v-if="column.title ==='RowOptions'")
            span(
              v-if="selectAll | selectedMultiple"
              id="delete-all"
            )
              delete(
                :select-all="selectAll"
                :selected="selected"
                @handle-delete="handleDelete"
              )
    template(#item="props")
      tr(
        :id="'qa-'+props.item.qid"
        @click="props.toggleExpand(props.internalItem)"
      )
        td.shrink(
          v-if="active==='questions'"
          @click.stop=""
        )
          v-checkbox(
            :id="'qa-'+props.item.qid+'-select'"
            v-model="props.item.select"
            color="primary"
            tabindex="-1"
            @change="checkSelect"
          )
        td.text-xs-left.shrink.primary--text.text-h6(
          v-if="active==='test'"
        ) {{ props.item._score || '-' }}
        td.text-xs-left.shrink.text-h6
          b(:id="props.item.qid") {{ props.item.qid }}
        td.text-xs-left.text-h6.font-weight-regular {{ props.item.type || 'qna' }}
        td.text-xs-left.text-h6.font-weight-regular {{ (props.item.q && props.item.q[0]) ? props.item.q[0] : (props.item.question ? props.item.question: '') }}
        td.flex-grow-1.pa-0.pr-1
          edit(
            :id="'qa-'+props.item.qid+'-edit'"
            v-model:data="props.item"
            @filter="get()"
            @click.stop=""
          )
          delete(
            :id="'qa-'+props.item.qid+'-delete'"
            :data="props.item"
            @handle-delete="handleDelete"
          )
    template(#expanded-row="{ columns, item }")
      tr
        td(:colspan="columns.length+2")
          qa(:data="item")
  v-dialog(v-model="deleteLoading" persistent id="delete-loading" max-width='60%')
    v-card(title="Deleting")
      v-card-text(v-if="!selectAll")
        ul.my-3
          li(v-for="id in deleteIds") {{id}}
      v-card-text
        v-list-subheader.text-error(v-if='deleteError' id="delete-error") {{deleteError}}
        v-list-subheader.text-success(v-if='deleteSuccess' id="delete-success") {{deleteSuccess}}
        v-progress-linear(v-if='!deleteError && !deleteSuccess' indeterminate)
      v-card-actions
        v-spacer
        v-btn.font-weight-bold(@click='deleteClose' flat) close
</template>

<script>
require('vuex');
const _ = require('lodash');

module.exports = {
    data: () => ({
        drawer: false,
        active: null,
        tab: '',
        search: '',
        selected: [],
        selectAll: false,
        expanded: [],
        deleteLoading: false,
        deleteError: '',
        deleteSuccess: '',
        deleteIds: [],
        itemsPerPage: 100,
        page: 1,
        sortBy: [],
        perpage: [
            { value: 5, title: '5' },
            { value: 10, title: '10' },
            { value: 25, title: '25' },
            { value: 50, title: '50' },
            { value: 100, title: '100' }
        ],
        pagination: {
            page: 1,
            rowsPerPage: '100',
            sortBy: 'qid'
        },
        headers: [
            {
                title: 'SelectAll',
                align: 'left',
                sortable: false
            },
            {
                title: 'Id',
                value: 'qid',
                align: 'left',
                sortable: true
            },
            {
                title: 'Type',
                value: 'type',
                align: 'left',
                sortable: false
            },
            {
                title: 'First Question',
                value: 'q[0] || a',
                align: 'left',
                sortable: false
            },
            {
                title: 'RowOptions',
                align: 'left',
                sortable: false
            }
        ]
    }),
    components: {
        qa: require('./qa.vue').default,
        questions: require('./menu-questions.vue').default,
        test: require('./menu-test.vue').default,
        testAll: require('./menu-testall.vue').default,
        delete: require('./delete.vue').default,
        edit: require('./edit.vue').default,
        build: require('./rebuild.vue').default,
        alexa: require('./alexa.vue').default,
        sync: require('./synckendra.vue').default
    },
    computed: {
        empty() {
            return { empty: !this.total };
        },
        loading() {
            return this.$store.state.data.loading;
        },
        QAs() {
            return this.$store.state.data.QAs;
        },
        total() {
            return this.$store.state.page.total;
        },
        selectedMultiple() {
            return this.QAs.map((x) => x.select).includes(true);
        }
    },
    async created() {
        await this.$store.dispatch('data/schema');
        this.$store.dispatch('data/botinfo').catch((err) => console.log(`error while obtaining botinfo: ${err}`));
        await this.get();
    },
    watch: {
        active(tab) {
            if (tab === 'test') {
                this.sortBy = [{ key: 'score', order: 'desc' }];
            } else {
                this.sortBy = [{ key: 'qid', order: 'asc' }];
                this.get();
            }
        }
    },
    methods: {
        loadItems({ page, sortBy }) {
            this.page = page;
            this.sortBy = sortBy;
            this.get();
        },
        refresh() {
            this.itemsPerPage = 100;
            this.sortBy = [];
            this.page = 1;
            this.get();
        },
        get: _.debounce(async function () {
            if (this.active === 'questions') {
                this.selectAll = false;
                await this.$store.dispatch('data/get', {
                    page: this.page - 1,
                    perpage: this.itemsPerPage,
                    order: this.sortBy[0] ? this.sortBy[0].order : 'asc',
                });
            }
        }, 100, { trailing: true, leading: false }),
        checkSelect(value) {
            // If unchecking an item, selectAll should be false
            if (!value) {
                this.selectAll = false;
            } else {
                // If checking an item, only set selectAll to true if all items are now selected
                this.selectAll = this.QAs.every((qa) => qa.select);
            }
        },
        toggleSelectAll() {
            this.$store.commit('data/selectAll', this.selectAll);
        },
        deleteClose() {
            this.deleteLoading = false;
            this.deleteError = '';
            this.deleteSuccess = '';
            this.deleteIds = [];
        },
        handleDelete(questions) {
            const self = this;
            this.deleteLoading = true;
            this.deleteIds = questions.map((x) => x.qid);
            return (async () => {
                if (self.selectAll) {
                    return self.$store.dispatch('data/removeFilter').then(() => (self.selectAll = false));
                }
                return (async () => {
                    if (questions.length === 1) {
                        return self.$store.dispatch('data/removeQA', questions[0]);
                    }

                    return self.$store.dispatch('data/removeQAs', questions);
                })();
            })()
                .then(() => self.$store.commit('data/selectAll', false))
                .then(() => (this.deleteSuccess = 'Success!'))
                .catch((error) => (this.deleteError = error));
        },
        edit: console.log
    }
};
</script>
<style lang="scss">
.tabs__item {
    color: white !important;
}
</style>
<style lang="scss" scoped>
.shrink {
    width: 10%;
}
.root-card {
    margin: auto;
}
.icon {
    cursor: pointer;
}
.datatable thead th.title {
    .icon {
        font-size: inherit;
    }
}
.buttons {
    position: absolute;
    right: 0;
}
tr {
    position: relative;
}
.icon-button {
    background: transparent;
    box-shadow: none !important;
    border-radius: 50%;
    justify-content: center;
}
</style>
